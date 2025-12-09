# Low-Level Design (LLD) - Security Control Tower (SCT)

## Table of Contents
1. [Component Architecture](#component-architecture)
2. [Service Layer Design](#service-layer-design)
3. [Data Models](#data-models)
4. [Authentication Flow](#authentication-flow)
5. [Query Processing Pipeline](#query-processing-pipeline)
6. [User Interface Components](#user-interface-components)
7. [Error Handling](#error-handling)
8. [Configuration Management](#configuration-management)

---

## Component Architecture

### Application Module Structure

```
SCT-UI/
├── src/
│   ├── app/
│   │   ├── models/              # Data models and interfaces
│   │   │   └── mcp.models.ts    # MCP protocol and data models
│   │   ├── services/            # Business logic services
│   │   │   ├── auth.service.ts
│   │   │   ├── log-analytics.service.ts
│   │   │   ├── openai.service.ts
│   │   │   ├── sentinel-query.service.ts
│   │   │   └── sidebar.service.ts
│   │   ├── screens/             # Feature components
│   │   │   ├── dashboard/
│   │   │   ├── sentribot/
│   │   │   └── overview/
│   │   ├── layout/              # Layout components
│   │   │   ├── header/
│   │   │   └── main/
│   │   ├── pipes/               # Custom pipes
│   │   │   └── markdown.pipe.ts
│   │   ├── msal/                # MSAL configuration
│   │   │   ├── msal.config.ts
│   │   │   └── msal-logger.ts
│   │   ├── app.module.ts
│   │   ├── app-routing.module.ts
│   │   └── app.component.ts
│   └── environments/            # Environment configurations
│       ├── environment.ts
│       └── environment.prod.ts
```

---

## Service Layer Design

### 1. AuthService

**Purpose**: Manages authentication and authorization using Azure AD MSAL.

**Key Responsibilities**:
- User authentication state management
- Access token acquisition for different Azure services
- Token caching and refresh
- User profile information retrieval

**Public Methods**:

```typescript
interface AuthService {
  // Get currently authenticated user
  getCurrentUser(): AccountInfo | null;
  
  // Check if user is authenticated
  isAuthenticated(): boolean;
  
  // Acquire token for Power BI API
  getPowerBiAccessToken(): Promise<string>;
  
  // Acquire token for Log Analytics API
  getLogAnalyticsToken(): Promise<AuthenticationResult>;
  
  // Initiate login flow
  login(): void;
  
  // Initiate logout flow
  logout(): void;
}
```

**Token Scopes**:
- Power BI: `https://analysis.windows.net/powerbi/api/.default`
- Log Analytics: `https://api.loganalytics.io/.default`
- Microsoft Graph: `User.Read`

**Error Handling**:
- Silent token acquisition with fallback to interactive login
- Automatic token refresh before expiration
- Clear error messages for authentication failures

---

### 2. LogAnalyticsService

**Purpose**: Executes KQL queries against Azure Log Analytics / Microsoft Sentinel.

**Key Responsibilities**:
- KQL query execution
- Result parsing and transformation
- Error handling for API failures
- Token management integration

**Public Methods**:

```typescript
interface LogAnalyticsService {
  // Execute KQL query with timespan
  executeQuery(
    kqlQuery: string, 
    timespan?: string
  ): Observable<QueryResult>;
}
```

**Query Execution Flow**:

```
1. Acquire Log Analytics access token (via AuthService)
2. Construct API request with workspace ID
3. POST query to Log Analytics REST API
4. Parse response tables and columns
5. Transform rows into typed objects
6. Return QueryResult observable
7. Handle errors and provide detailed error messages
```

**API Endpoint**:
```
POST https://api.loganalytics.io/v1/workspaces/{workspaceId}/query
Content-Type: application/json
Authorization: Bearer {token}

{
  "query": "SecurityIncident | where TimeGenerated > ago(7d) | take 20",
  "timespan": "P7D"
}
```

**Response Parsing**:
- Converts Log Analytics columnar format to JSON objects
- Maps column names to object properties
- Handles null values appropriately
- Returns row count for result validation

---

### 3. OpenAIService

**Purpose**: Interfaces with Azure OpenAI for AI-powered capabilities.

**Key Responsibilities**:
- Chat completion requests
- Function calling support
- Natural language processing
- Response streaming (future enhancement)

**Public Methods**:

```typescript
interface OpenAIService {
  // Send chat completion with optional functions
  chatCompletion(
    messages: OpenAIMessage[],
    functions?: OpenAIFunction[],
    functionCall?: 'auto' | 'none' | { name: string }
  ): Observable<OpenAIChatResponse>;
  
  // Simple text completion helper
  ask(
    userMessage: string,
    systemPrompt?: string
  ): Observable<string>;
}
```

**Message Format** (OpenAI Chat Protocol):
```typescript
{
  role: 'system' | 'user' | 'assistant' | 'function',
  content: string | null,
  name?: string,
  function_call?: {
    name: string,
    arguments: string  // JSON string
  }
}
```

**Function Calling**:
- Defines available functions with JSON schema
- OpenAI determines when to call functions
- Application executes function and returns result
- OpenAI generates final response based on function output

---

### 4. SentinelQueryService

**Purpose**: Orchestrates natural language queries to Sentinel data using AI.

**Key Responsibilities**:
- Natural language to KQL conversion
- Multi-source incident correlation
- User risk analysis
- Query validation and optimization
- Result interpretation and formatting

**Query Processing Pipeline**:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Natural Language Input                                    │
│    "Find the top three users that are at risk"             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. OpenAI Function Call                                      │
│    - System prompt with security context                     │
│    - User query                                              │
│    - Available functions (query_sentinel_data)              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. KQL Query Generation                                      │
│    AADUserRiskEvents                                         │
│    | where TimeGenerated > ago(30d)                         │
│    | summarize TotalRisks = count(),                        │
│      Reasons = make_set(RiskEventType)                      │
│      by UserPrincipalName, RiskLevel                        │
│    | top 3 by TotalRisks desc                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Query Validation                                          │
│    - Check for required TimeGenerated filter                 │
│    - Verify result limiting (take/top)                      │
│    - Validate table and column names                        │
│    - Check for dangerous operations                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Execute via LogAnalyticsService                          │
│    - Acquire auth token                                      │
│    - POST to Log Analytics API                              │
│    - Parse response                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Result Analysis (Second OpenAI Call)                     │
│    - Send query results back to OpenAI                      │
│    - Request formatted analysis                             │
│    - Include security context and recommendations           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Formatted Response                                        │
│    📊 Executive Summary                                      │
│    🔍 Detailed Findings                                     │
│    ⚠️ Risk Assessment                                       │
│    💡 Recommendations                                       │
│    📋 Technical Details                                     │
└─────────────────────────────────────────────────────────────┘
```

**Query Validation Rules**:

```typescript
interface QueryValidation {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// Validation Checks:
// 1. Non-empty query
// 2. TimeGenerated filter present (performance)
// 3. Result limiting (prevent large responses)
// 4. No dangerous operations (drop, delete)
// 5. Correct table names (SecurityIncident, not Incidents)
// 6. Proper column names (Title, not IncidentName)
// 7. ExtendedProperties parsing with parse_json()
```

**Multi-Source Detection**:

The service automatically detects which security sources are being queried:

```typescript
private detectQuerySources(kqlQuery: string): string[] {
  const sources: string[] = [];
  
  // Qualys incidents
  if (kqlQuery.includes('7ec37e0e-5f7e-462d-8f5c-8225ad0fbdaa')) {
    sources.push('Qualys');
  }
  
  // Microsoft XDR incidents
  if (kqlQuery.includes('6d1f212d-4e30-4d67-916d-584475ed2ed4')) {
    sources.push('Microsoft XDR');
  }
  
  // Azure AD Identity Protection
  if (kqlQuery.includes('AADUserRiskEvents')) {
    sources.push('Azure AD Identity Protection');
  }
  
  return sources.length > 0 ? sources : ['All Sources'];
}
```

**System Prompt Structure**:

The AI assistant (SentriBot) uses a comprehensive system prompt that includes:
- Security domain expertise definition
- Available Sentinel tables and schemas
- Common KQL patterns and best practices
- User risk analysis guidelines
- Multi-source architecture context
- CVE vulnerability tracking patterns
- Response formatting guidelines

---

### 5. SidebarService

**Purpose**: Manages sidebar visibility state across the application.

**Implementation**:

```typescript
class SidebarService {
  private sidebarVisible = new BehaviorSubject<boolean>(true);
  sidebarVisible$ = this.sidebarVisible.asObservable();

  toggleSidebar() {
    this.sidebarVisible.next(!this.sidebarVisible.value);
  }
}
```

**Usage Pattern**:
- Components subscribe to `sidebarVisible$` observable
- Changes propagate automatically to all subscribers
- Reactive state management using RxJS

---

## Data Models

### Model Context Protocol (MCP) Models

The application uses MCP (Model Context Protocol) based on JSON-RPC 2.0 for structured communication:

```typescript
// Base MCP Request
interface McpRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: number | string;
}

// Base MCP Response
interface McpResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: McpError;
  id: number | string;
}

// Tool Call Structure
interface McpToolCall {
  name: string;
  arguments: Record<string, any>;
}

// Tool Result
interface McpToolResult {
  content: McpContent[];
  isError?: boolean;
}
```

### OpenAI Integration Models

```typescript
// Message in conversation
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | null;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;  // JSON encoded
  };
}

// Function definition for OpenAI
interface OpenAIFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Chat completion request
interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  functions?: OpenAIFunction[];
  function_call?: 'auto' | 'none' | { name: string };
  temperature?: number;
  max_tokens?: number;
}
```

### Log Analytics Models

```typescript
// Query request
interface LogAnalyticsQuery {
  query: string;
  timespan?: string;  // ISO 8601 duration (P1D, PT1H, etc.)
}

// Column metadata
interface LogAnalyticsColumn {
  name: string;
  type: string;  // string, int, long, real, bool, datetime, dynamic
}

// Response table structure
interface LogAnalyticsTable {
  name: string;
  columns: LogAnalyticsColumn[];
  rows: any[][];  // Array of arrays (columnar format)
}

// Parsed query result
interface QueryResult {
  success: boolean;
  data?: any[];  // Transformed to objects
  columns?: LogAnalyticsColumn[];
  error?: string;
  executedQuery: string;
  rowCount?: number;
}
```

### Sentinel Query Models

```typescript
// End-user query result
interface SentinelQueryResult {
  query: string;              // Original user query
  kqlQuery?: string;          // Generated KQL
  result: string;             // Formatted markdown response
  data?: any[];               // Raw data
  timestamp: Date;            // Query execution time
  isError: boolean;           // Success/failure flag
}
```

---

## Authentication Flow

### Initial Authentication

```
┌─────────┐                ┌──────────┐              ┌─────────┐
│ Browser │                │   SCT    │              │Azure AD │
│         │                │   App    │              │         │
└────┬────┘                └────┬─────┘              └────┬────┘
     │                          │                         │
     │  1. Navigate to /        │                         │
     │─────────────────────────>│                         │
     │                          │                         │
     │  2. Check authentication │                         │
     │          (MsalGuard)     │                         │
     │                          │                         │
     │  3. Redirect to login    │                         │
     │<─────────────────────────│                         │
     │                          │                         │
     │  4. Login page           │                         │
     │─────────────────────────────────────────────────>│
     │                          │                         │
     │  5. User enters credentials                       │
     │─────────────────────────────────────────────────>│
     │                          │                         │
     │  6. Return authorization code                     │
     │<─────────────────────────────────────────────────│
     │                          │                         │
     │  7. Exchange code for tokens                      │
     │─────────────────────────────────────────────────>│
     │                          │                         │
     │  8. Access token + ID token                       │
     │<─────────────────────────────────────────────────│
     │                          │                         │
     │  9. Store in token cache │                         │
     │─────────────────────────>│                         │
     │                          │                         │
     │ 10. Redirect to app      │                         │
     │<─────────────────────────│                         │
```

### Token Acquisition for API Calls

```
┌────────────┐          ┌─────────────┐          ┌────────────┐
│ Component  │          │AuthService  │          │MSAL Library│
└─────┬──────┘          └──────┬──────┘          └─────┬──────┘
      │                        │                        │
      │ getLogAnalyticsToken() │                        │
      │───────────────────────>│                        │
      │                        │                        │
      │                        │ acquireTokenSilent()   │
      │                        │───────────────────────>│
      │                        │                        │
      │                        │ Check cache            │
      │                        │<───────────────────────│
      │                        │                        │
      │                        │ If cached & valid:     │
      │                        │   Return token         │
      │                        │<───────────────────────│
      │                        │                        │
      │                        │ If expired:            │
      │                        │   Refresh token        │
      │                        │   silently             │
      │                        │                        │
      │ Return token           │                        │
      │<───────────────────────│                        │
```

### MSAL Configuration

```typescript
// Factory function creates MSAL instance
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msalConfigs.authentication.clientId,
      authority: environment.msalConfigs.authentication.authority,
      redirectUri: environment.msalConfigs.authentication.redirectUri,
      postLogoutRedirectUri: environment.msalConfigs.authentication.postLogoutRedirectUri
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          // Custom logging logic
        },
        logLevel: LogLevel.Verbose,
        piiLoggingEnabled: false
      }
    }
  });
}
```

### Protected Resource Map

```typescript
// MSAL Interceptor configuration
export function MSALInterceptorConfigFactory() {
  const protectedResourceMap = new Map<string, Array<string>>();
  
  // Log Analytics API
  protectedResourceMap.set(
    'https://api.loganalytics.io/v1',
    ['https://api.loganalytics.io/.default']
  );
  
  // Azure Management API
  protectedResourceMap.set(
    'https://management.azure.com/',
    ['https://management.azure.com/user_impersonation']
  );
  
  // Microsoft Graph API
  protectedResourceMap.set(
    'https://graph.microsoft.com/v1.0',
    ['User.Read']
  );

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}
```

---

## Query Processing Pipeline

### SentriBot Query Flow

**Step-by-Step Process**:

1. **User Input**: Natural language query entered in SentriBot UI
2. **Validation**: Basic input validation (non-empty)
3. **OpenAI Request**: Send query with system prompt and function definitions
4. **Function Call Decision**: OpenAI decides to call `query_sentinel_data`
5. **KQL Generation**: OpenAI generates appropriate KQL query
6. **Query Validation**: Validate generated KQL for safety and performance
7. **Query Execution**: Execute KQL via LogAnalyticsService
8. **Result Parsing**: Parse columnar data into objects
9. **Analysis Request**: Send results back to OpenAI for interpretation
10. **Response Formatting**: OpenAI formats response with insights
11. **UI Rendering**: Display markdown-formatted response

### Example Query Transformation

**User Input**:
```
"Find the top three users that are at risk"
```

**Generated KQL**:
```kql
AADUserRiskEvents 
| where TimeGenerated > ago(30d) 
| summarize TotalRisks = count(), 
            Reasons = make_set(RiskEventType) 
            by UserPrincipalName, RiskLevel 
| top 3 by TotalRisks desc 
| extend RiskReason = strcat_array(Reasons, ', ') 
| project UserPrincipalName, RiskLevel, TotalRisks, RiskReason
```

**AI Analysis Output**:
```markdown
📊 **Top 3 At-Risk Users Analysis**

Based on the last 30 days of risk events:

🔍 **Users Identified**:

1. **john.doe@company.com** (High Risk)
   - Total Risk Events: 15
   - Risk Types: maliciousIPAddress, leakedCredentials
   - Recommended Action: Immediate password reset + MFA enforcement

2. **jane.smith@company.com** (Medium Risk)
   - Total Risk Events: 8
   - Risk Types: unfamiliarFeatures, suspiciousIPAddress
   - Recommended Action: Review sign-in locations

3. **bob.jones@company.com** (Medium Risk)
   - Total Risk Events: 5
   - Risk Types: anonymizedIPAddress
   - Recommended Action: Conditional access policy enforcement

⚠️ **Security Recommendations**:
- Enable risk-based conditional access
- Enforce MFA for all high-risk users
- Review and update sign-in policies
```

---

## User Interface Components

### Component Hierarchy

```
AppComponent
├── HeaderComponent
│   ├── User Profile Display
│   ├── Logout Button
│   └── Sidebar Toggle
├── MainComponent (Router Outlet Container)
│   ├── Sidebar Navigation
│   └── ContentArea
│       ├── DashboardComponent (Power BI Embedded)
│       ├── SentribotComponent (AI Chat Interface)
│       └── OverviewComponent (Security Posture)
```

### DashboardComponent

**Purpose**: Embeds Power BI reports for security visualizations.

**Key Features**:
- Dynamic report selection based on route
- Token-based authentication with Power BI
- Responsive iframe embedding
- Navigation control management

**Power BI Configuration**:
```typescript
const embedConfig: powerbi.IEmbedConfiguration = {
  type: 'report',
  id: '{report-id}',
  embedUrl: '{embed-url}',
  accessToken: accessToken,
  tokenType: powerbi.models.TokenType.Embed,
  settings: {
    panes: {
      filters: { visible: false },
      pageNavigation: { visible: false }
    },
    background: powerbi.models.BackgroundType.Transparent
  }
};
```

### SentribotComponent

**Purpose**: AI-powered natural language security query interface.

**UI Elements**:
- **Query Input**: Textarea with Enter key support (Shift+Enter for new line)
- **Example Queries**: Clickable examples for user guidance
- **Loading Indicator**: Shows during query processing
- **Results Display**: Markdown-formatted responses with syntax highlighting
- **Error Messages**: Clear error descriptions

**User Interaction Flow**:
```typescript
onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    this.submitQuery();
  }
}

submitQuery(): void {
  this.isLoading = true;
  
  this.sentinelQueryService.querySentinel(this.query).subscribe({
    next: (result) => {
      this.results.unshift(result);
      this.isLoading = false;
      if (!result.isError) {
        this.query = '';  // Clear on success
      }
    },
    error: (error) => {
      this.errorMessage = error.message;
      this.isLoading = false;
    }
  });
}
```

### OverviewComponent

**Purpose**: Displays security posture metrics and AI insights.

**Data Sections**:
1. **Secure Score**: Microsoft Secure Score breakdown by category
2. **AI Insights**: Predictive security alerts and recommendations
3. **Performance Metrics**: MTTR, incident SLA tracking
4. **Connected Systems**: Integration health monitoring

**AI Insights Structure**:
```typescript
interface AIInsight {
  id: number;
  category: 'Threat Detection' | 'Vulnerability Assessment' | 
           'Behavioral Analytics' | 'Predictive Security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number;  // 0-100
  recommendation: string;
  icon: string;
}
```

### MarkdownPipe

**Purpose**: Transforms markdown text to HTML for display.

**Supported Markdown Features**:
- Headers (H1-H4)
- Bold and italic text
- Inline code and code blocks
- Links
- Bullet lists
- Horizontal rules
- Line breaks

**Implementation Pattern**:
```typescript
transform(value: string): SafeHtml {
  let html = value
    .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    // ... more transformations
    
  return this.sanitizer.bypassSecurityTrustHtml(html);
}
```

---

## Error Handling

### Service-Level Error Handling

**LogAnalyticsService Error Strategy**:

```typescript
executeQuery(kqlQuery: string, timespan: string): Observable<QueryResult> {
  return this.getAccessToken().pipe(
    switchMap(token => this.http.post(url, body, { headers })),
    map(response => this.parseResponse(kqlQuery, response)),
    catchError(error => {
      // Parse API error structure
      let errorMessage = 'Query failed';
      
      if (error.error?.error?.message) {
        errorMessage = error.error.error.message;
      }
      
      // Return structured error result
      return throwError(() => ({
        success: false,
        error: errorMessage,
        executedQuery: kqlQuery
      } as QueryResult));
    })
  );
}
```

**Error Types and Handling**:

| Error Type | HTTP Status | Handling Strategy |
|-----------|-------------|-------------------|
| Authentication Failed | 401 | Trigger interactive login |
| Permission Denied | 403 | Show required roles message |
| Resource Not Found | 404 | Validate workspace ID |
| Rate Limit Exceeded | 429 | Implement exponential backoff |
| Invalid KQL Syntax | 400 | Display syntax error details |
| Network Timeout | 504 | Retry with increased timeout |

### Component-Level Error Display

**Error Message Structure**:
```typescript
interface ErrorDisplay {
  title: string;
  message: string;
  details?: string;
  troubleshooting?: string[];
  technicalInfo?: {
    query?: string;
    statusCode?: number;
    timestamp: Date;
  };
}
```

---

## Configuration Management

### Environment Configuration

**Development Environment** (`environment.ts`):
```typescript
export const environment = {
  production: false,
  connectorsUri: 'http://localhost:4200/',
  msalConfigs: {
    authentication: {
      clientId: '{dev-client-id}',
      authority: 'https://login.microsoftonline.com/{tenant-id}',
      redirectUri: 'http://localhost:4200/',
      postLogoutRedirectUri: 'http://localhost:4200/'
    },
    logAnalytics: {
      workspaceId: '{workspace-id}',
      url: 'https://api.loganalytics.io/v1/workspaces',
      scopes: ['https://api.loganalytics.io/.default']
    },
    openai: {
      apiKey: '{openai-api-key}',
      apiUrl: '{openai-endpoint}',
      model: 'gpt-4o'
    }
  }
};
```

**Production Environment** (`environment.prod.ts`):
- Same structure with production values
- API keys managed via Azure Key Vault (recommended)
- Production URLs and endpoints

### Security Configuration Best Practices

1. **Never Commit Secrets**: Use environment variables or Azure Key Vault
2. **Separate Configurations**: Different tenant IDs for dev/prod
3. **Minimal Scopes**: Request only necessary API permissions
4. **Token Expiration**: Configure appropriate token lifetimes
5. **CORS Configuration**: Whitelist only trusted domains

---

## Performance Considerations

### Query Optimization

**Automatic Optimizations**:
- All queries include `TimeGenerated` filters
- Result sets limited with `take` or `top` clauses
- Summarization preferred over raw data retrieval
- Early filtering in KQL pipeline

**Rate Limiting Protection**:
```typescript
// Query validation enforces limits
private validateKqlQuery(query: string): QueryValidation {
  const hasLimit = /(take|top|limit)\s+\d+/i.test(query);
  const hasSummarize = /summarize/i.test(query);
  
  if (!hasLimit && !hasSummarize) {
    warnings.push('Query may return large result set');
  }
  
  return { valid: true, warnings };
}
```

### Caching Strategy

**Token Caching**:
- MSAL automatically caches tokens in localStorage
- Token refresh handled silently before expiration
- Shared token cache across browser tabs

**Component State**:
- RxJS BehaviorSubjects cache latest values
- Subscription management prevents memory leaks
- OnPush change detection for performance

---

## Testing Strategy

### Unit Testing

**Service Tests**:
```typescript
describe('AuthService', () => {
  it('should return current user when authenticated', () => {
    // Mock MSAL instance
    // Test getCurrentUser()
  });
  
  it('should acquire token for Log Analytics', async () => {
    // Mock token acquisition
    // Verify token scopes
  });
});
```

**Component Tests**:
```typescript
describe('SentribotComponent', () => {
  it('should submit query on Enter key', () => {
    // Mock keyboard event
    // Verify submitQuery called
  });
  
  it('should display loading indicator during query', () => {
    // Start query
    // Check isLoading flag
  });
});
```

### Integration Testing

**API Integration**:
- Test actual Log Analytics API calls (with test workspace)
- Verify OpenAI function calling flow
- Validate token acquisition and refresh

**End-to-End Testing**:
- Full user authentication flow
- Query submission and result display
- Navigation between components
- Power BI embedding

---

## Deployment

### Build Process

```bash
# Install dependencies
npm install

# Development build
ng build

# Production build (optimized)
ng build --configuration production
```

### Production Deployment Checklist

- [ ] Update environment.prod.ts with production values
- [ ] Configure Azure AD app registration
- [ ] Set up Log Analytics workspace
- [ ] Deploy Azure OpenAI service
- [ ] Configure Power BI workspace
- [ ] Set up Azure App Service or Static Web Apps
- [ ] Configure custom domain and SSL
- [ ] Set up Application Insights monitoring
- [ ] Configure CDN for static assets
- [ ] Test authentication flow
- [ ] Verify API connectivity
- [ ] Load test with expected user volume

---

## Appendix

### KQL Query Examples

**Security Incident Query**:
```kql
SecurityIncident
| where TimeGenerated >= ago(7d)
| where Severity in ('High', 'Critical')
| summarize Count=count() by Severity, Status
| order by Count desc
```

**User Risk Analysis**:
```kql
AADUserRiskEvents
| where TimeGenerated > ago(30d)
| where RiskLevel in ('high', 'medium')
| summarize Events=count(), Types=make_set(RiskEventType) 
            by UserPrincipalName, RiskLevel
| top 10 by Events desc
```

**CVE Tracking**:
```kql
SecurityIncident
| where TimeGenerated >= ago(30d)
| where Title contains "CVE"
| extend CVE_ID = extract(@'CVE-([\d-]+)', 1, Title),
         AppName = extract(@'on (.+)$', 1, Title)
| where isnotempty(CVE_ID)
| summarize IncidentCount=count() by CVE_ID, AppName, Severity
| order by IncidentCount desc
```

### API Reference

**Log Analytics REST API**:
```
POST https://api.loganalytics.io/v1/workspaces/{workspaceId}/query
Authorization: Bearer {token}
Content-Type: application/json

{
  "query": "KQL query string",
  "timespan": "P7D"
}
```

**Azure OpenAI Chat Completions**:
```
POST {endpoint}/openai/deployments/{deployment}/chat/completions
api-key: {key}
Content-Type: application/json

{
  "messages": [...],
  "functions": [...],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: SCT Development Team
