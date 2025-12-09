# Technical Reference - Security Control Tower (SCT)

## Overview

This document provides technical reference information for developers, DevOps engineers, and technical stakeholders working with the Security Control Tower application.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Development Environment Setup](#development-environment-setup)
3. [Configuration Reference](#configuration-reference)
4. [API Reference](#api-reference)
5. [Service Interfaces](#service-interfaces)
6. [Data Models Reference](#data-models-reference)
7. [KQL Query Patterns](#kql-query-patterns)
8. [Deployment Guide](#deployment-guide)
9. [Troubleshooting](#troubleshooting)
10. [Performance Optimization](#performance-optimization)

---

## Technology Stack

### Frontend
| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| Angular | 18.x | SPA Framework | [angular.io](https://angular.io) |
| TypeScript | 5.4.x | Type-safe JavaScript | [typescriptlang.org](https://www.typescriptlang.org) |
| Angular Material | 18.x | UI Component Library | [material.angular.io](https://material.angular.io) |
| RxJS | 7.8.x | Reactive Programming | [rxjs.dev](https://rxjs.dev) |
| MSAL Angular | 4.x | Azure AD Authentication | [GitHub](https://github.com/AzureAD/microsoft-authentication-library-for-js) |
| Power BI Client | 2.23.x | Dashboard Embedding | [Microsoft Docs](https://docs.microsoft.com/power-bi/developer/embedded/) |
| Bootstrap | 5.3.x | CSS Framework | [getbootstrap.com](https://getbootstrap.com) |
| Marked | 12.x | Markdown Parsing | [marked.js.org](https://marked.js.org) |

### Backend Services (Azure)
| Service | Purpose | Endpoint Pattern |
|---------|---------|------------------|
| Azure AD B2C | Authentication | login.microsoftonline.com |
| Azure Log Analytics | Security Data Storage | api.loganalytics.io/v1 |
| Azure OpenAI | AI Processing | {region}.cognitiveservices.azure.com |
| Power BI Embedded | Dashboards | app.powerbi.com |
| Microsoft Sentinel | Security Analytics | Integrated with Log Analytics |

### Development Tools
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Angular CLI**: 18.x
- **Git**: Version control
- **VS Code**: Recommended IDE (with Angular extensions)

---

## Development Environment Setup

### Prerequisites

1. **Install Node.js and npm**:
   ```bash
   # Download from nodejs.org or use nvm
   node --version  # Should be 18.x+
   npm --version   # Should be 9.x+
   ```

2. **Install Angular CLI**:
   ```bash
   npm install -g @angular/cli@18
   ng version
   ```

3. **Clone Repository**:
   ```bash
   git clone https://github.com/VaishanviM23/SCT.git
   cd SCT/SCT-UI
   ```

4. **Install Dependencies**:
   ```bash
   npm install
   ```

### Configuration

1. **Environment Configuration** (`src/environments/environment.ts`):
   ```typescript
   export const environment = {
     production: false,
     msalConfigs: {
       authentication: {
         clientId: 'YOUR_CLIENT_ID',
         authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
         redirectUri: 'http://localhost:4200/',
         postLogoutRedirectUri: 'http://localhost:4200/'
       },
       logAnalytics: {
         workspaceId: 'YOUR_WORKSPACE_ID',
         url: 'https://api.loganalytics.io/v1/workspaces',
         scopes: ['https://api.loganalytics.io/.default']
       },
       openai: {
         apiKey: 'YOUR_OPENAI_API_KEY',
         apiUrl: 'https://YOUR_ENDPOINT.cognitiveservices.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview',
         model: 'gpt-4o'
       }
     }
   };
   ```

2. **Azure AD App Registration**:
   - Navigate to Azure Portal → Azure Active Directory → App Registrations
   - Create new registration:
     - Name: SCT Application
     - Supported account types: Single tenant
     - Redirect URI: http://localhost:4200/ (for dev)
   - Note Client ID
   - Grant API permissions:
     - Microsoft Graph: User.Read
     - Log Analytics API: Data.Read
     - Azure Management: user_impersonation

3. **Log Analytics Workspace Setup**:
   - Ensure Microsoft Sentinel is enabled
   - Grant user "Log Analytics Reader" role
   - Note Workspace ID from workspace properties

4. **Azure OpenAI Deployment**:
   - Deploy GPT-4o model
   - Note endpoint URL
   - Copy API key from Keys and Endpoint section

### Running Locally

```bash
# Development server with live reload
ng serve

# Navigate to http://localhost:4200/
# Application will automatically reload on code changes
```

### Building for Production

```bash
# Production build (optimized, minified)
ng build --configuration production

# Output in dist/ directory
# Deploy contents to Azure App Service or Static Web Apps
```

---

## Configuration Reference

### Angular Configuration (`angular.json`)

```json
{
  "projects": {
    "sct-ui": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/sct-ui",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.scss"],
            "scripts": []
          }
        }
      }
    }
  }
}
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### MSAL Configuration (`src/app/msal/msal.config.ts`)

```typescript
export const MsalConfig = {
  auth: {
    clientId: environment.msalConfigs.authentication.clientId,
    authority: environment.msalConfigs.authentication.authority,
    redirectUri: environment.msalConfigs.authentication.redirectUri,
    postLogoutRedirectUri: environment.msalConfigs.authentication.postLogoutRedirectUri
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
};
```

---

## API Reference

### Log Analytics REST API

**Base URL**: `https://api.loganalytics.io/v1/workspaces/{workspaceId}/query`

**Authentication**: Bearer token (Azure AD)

**Request Format**:
```http
POST /v1/workspaces/{workspaceId}/query HTTP/1.1
Host: api.loganalytics.io
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "query": "SecurityIncident | where TimeGenerated >= ago(7d) | take 20",
  "timespan": "P7D"
}
```

**Response Format**:
```json
{
  "tables": [
    {
      "name": "PrimaryResult",
      "columns": [
        {"name": "TimeGenerated", "type": "datetime"},
        {"name": "Title", "type": "string"},
        {"name": "Severity", "type": "string"}
      ],
      "rows": [
        ["2024-01-15T10:30:00Z", "High severity incident", "High"],
        ["2024-01-15T11:45:00Z", "Medium severity alert", "Medium"]
      ]
    }
  ]
}
```

**Timespan Format** (ISO 8601 Duration):
- `PT1H` = Last 1 hour
- `P1D` = Last 1 day
- `P7D` = Last 7 days
- `P30D` = Last 30 days
- `P1M` = Last 1 month

**Error Responses**:
```json
{
  "error": {
    "message": "The query syntax is incorrect",
    "code": "BadRequest",
    "innererror": {
      "code": "SyntaxError",
      "message": "Token 'where' is not recognized"
    }
  }
}
```

### Azure OpenAI Chat Completions API

**Base URL**: `https://{resource}.cognitiveservices.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2025-01-01-preview`

**Authentication**: API Key

**Request Format**:
```http
POST /openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview HTTP/1.1
Host: {resource}.cognitiveservices.azure.com
api-key: {api_key}
Content-Type: application/json

{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "You are SentriBot..."},
    {"role": "user", "content": "Find risky users"}
  ],
  "functions": [
    {
      "name": "query_sentinel_data",
      "description": "Query Sentinel data",
      "parameters": {
        "type": "object",
        "properties": {
          "kql_query": {"type": "string"}
        }
      }
    }
  ],
  "function_call": "auto",
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**Response Format**:
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1704124800,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "function_call": {
          "name": "query_sentinel_data",
          "arguments": "{\"kql_query\":\"AADUserRiskEvents | where TimeGenerated > ago(30d) | summarize count() by UserPrincipalName | top 3 by count_\"}"
        }
      },
      "finish_reason": "function_call"
    }
  ],
  "usage": {
    "prompt_tokens": 1500,
    "completion_tokens": 50,
    "total_tokens": 1550
  }
}
```

### Power BI Embed API

**Get Embed Token**:
```http
POST /v1.0/myorg/groups/{groupId}/reports/{reportId}/GenerateToken HTTP/1.1
Host: api.powerbi.com
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "accessLevel": "View",
  "allowSaveAs": false
}
```

**Embed Configuration**:
```typescript
const embedConfig: powerbi.IEmbedConfiguration = {
  type: 'report',
  id: '{report-id}',
  embedUrl: 'https://app.powerbi.com/reportEmbed?reportId={report-id}',
  accessToken: '{embed-token}',
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

---

## Service Interfaces

### AuthService

```typescript
interface AuthService {
  /**
   * Get currently authenticated user account
   * @returns AccountInfo object or null if not authenticated
   */
  getCurrentUser(): AccountInfo | null;
  
  /**
   * Check if user is currently authenticated
   * @returns true if authenticated, false otherwise
   */
  isAuthenticated(): boolean;
  
  /**
   * Acquire access token for Power BI API
   * @returns Promise resolving to access token string
   * @throws Error if token acquisition fails
   */
  getPowerBiAccessToken(): Promise<string>;
  
  /**
   * Acquire access token for Log Analytics API
   * @returns Promise resolving to AuthenticationResult
   * @throws Error if no active account or token acquisition fails
   */
  getLogAnalyticsToken(): Promise<AuthenticationResult>;
  
  /**
   * Initiate login flow (redirects to Azure AD)
   */
  login(): void;
  
  /**
   * Initiate logout flow (clears tokens and redirects)
   */
  logout(): void;
}
```

### LogAnalyticsService

```typescript
interface LogAnalyticsService {
  /**
   * Execute KQL query against Log Analytics workspace
   * @param kqlQuery - The KQL query string to execute
   * @param timespan - Optional ISO 8601 duration (default: P1D)
   * @returns Observable<QueryResult> with query results or error
   * 
   * @example
   * executeQuery(
   *   'SecurityIncident | where TimeGenerated >= ago(7d) | take 20',
   *   'P7D'
   * ).subscribe(result => console.log(result));
   */
  executeQuery(kqlQuery: string, timespan?: string): Observable<QueryResult>;
}
```

### OpenAIService

```typescript
interface OpenAIService {
  /**
   * Send chat completion request to Azure OpenAI
   * @param messages - Array of conversation messages
   * @param functions - Optional array of available functions
   * @param functionCall - Function calling strategy ('auto', 'none', or specific function)
   * @returns Observable<OpenAIChatResponse> with AI response
   * 
   * @example
   * chatCompletion(
   *   [{role: 'user', content: 'Find risky users'}],
   *   sentinelFunctions,
   *   'auto'
   * ).subscribe(response => console.log(response));
   */
  chatCompletion(
    messages: OpenAIMessage[],
    functions?: OpenAIFunction[],
    functionCall?: 'auto' | 'none' | { name: string }
  ): Observable<OpenAIChatResponse>;
  
  /**
   * Simple text completion helper
   * @param userMessage - User's message/question
   * @param systemPrompt - Optional system prompt for context
   * @returns Observable<string> with AI response text
   * 
   * @example
   * ask('What is a CVE?', 'You are a security expert')
   *   .subscribe(answer => console.log(answer));
   */
  ask(userMessage: string, systemPrompt?: string): Observable<string>;
}
```

### SentinelQueryService

```typescript
interface SentinelQueryService {
  /**
   * Query Microsoft Sentinel using natural language
   * Orchestrates: NL → KQL generation → Query execution → AI analysis
   * 
   * @param userQuery - Natural language security question
   * @returns Observable<SentinelQueryResult> with formatted analysis
   * 
   * @example
   * querySentinel('Find the top three users that are at risk')
   *   .subscribe(result => {
   *     console.log(result.result); // Formatted markdown response
   *     console.log(result.kqlQuery); // Generated KQL query
   *     console.log(result.data); // Raw query results
   *   });
   */
  querySentinel(userQuery: string): Observable<SentinelQueryResult>;
}
```

---

## Data Models Reference

### Core Interfaces

```typescript
/**
 * Query result from Log Analytics
 */
interface QueryResult {
  success: boolean;
  data?: any[];
  columns?: LogAnalyticsColumn[];
  error?: string;
  executedQuery: string;
  rowCount?: number;
}

/**
 * Sentinel query result with AI analysis
 */
interface SentinelQueryResult {
  query: string;              // Original user query
  kqlQuery?: string;          // Generated KQL query
  result: string;             // Formatted markdown response
  data?: any[];               // Raw query data
  timestamp: Date;            // Query execution time
  isError: boolean;           // Success/failure flag
}

/**
 * OpenAI message in conversation
 */
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | null;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;  // JSON-encoded
  };
}

/**
 * OpenAI function definition
 */
interface OpenAIFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Log Analytics column metadata
 */
interface LogAnalyticsColumn {
  name: string;
  type: 'string' | 'int' | 'long' | 'real' | 'bool' | 'datetime' | 'dynamic';
}
```

### Sentinel Table Schemas

**SecurityIncident**:
```typescript
interface SecurityIncident {
  TimeGenerated: Date;
  Title: string;
  IncidentNumber: string;
  Severity: 'High' | 'Medium' | 'Low' | 'Informational';
  Status: 'New' | 'Active' | 'Closed';
  Classification: string;
  Owner: string;
  ProviderName: string;
  RelatedAnalyticRuleIds: string[];
  AlertIds: string[];
  FirstActivityTime: Date;
  LastActivityTime: Date;
}
```

**AADUserRiskEvents**:
```typescript
interface AADUserRiskEvent {
  TimeGenerated: Date;
  UserPrincipalName: string;
  RiskLevel: 'High' | 'Medium' | 'Low';
  RiskEventType: string;
  RiskDetail: string;
  RiskState: 'active' | 'remediated' | 'dismissed';
  Source: string;
  CorrelationId: string;
}
```

**SigninLogs**:
```typescript
interface SigninLog {
  TimeGenerated: Date;
  UserPrincipalName: string;
  AppDisplayName: string;
  IPAddress: string;
  Location: string;
  ResultType: number;  // 0 = success
  ResultDescription: string;
  ConditionalAccessStatus: string;
  RiskState: string;
  RiskLevelDuringSignIn: string;
}
```

---

## KQL Query Patterns

### Basic Query Structure

```kql
TableName
| where TimeGenerated >= ago(7d)
| where Column == "value"
| project Column1, Column2, Column3
| take 20
```

### Common Patterns

**1. Security Incidents by Severity**:
```kql
SecurityIncident
| where TimeGenerated >= ago(7d)
| summarize Count=count() by Severity
| order by Count desc
```

**2. Top Risky Users**:
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

**3. Failed Sign-ins by Location**:
```kql
SigninLogs
| where TimeGenerated >= ago(24h)
| where ResultType != 0
| summarize FailedAttempts=count() by Location, IPAddress
| order by FailedAttempts desc
| take 10
```

**4. CVE Tracking**:
```kql
SecurityIncident
| where TimeGenerated >= ago(30d)
| where Title contains "CVE"
| extend CVE_ID = extract(@'CVE-([\d-]+)', 1, Title),
         AppName = extract(@'on (.+)$', 1, Title)
| where isnotempty(CVE_ID)
| project TimeGenerated, Title, CVE_ID, AppName, Severity, Status
| sort by TimeGenerated desc
```

**5. Qualys-Specific Incidents**:
```kql
SecurityIncident
| where TimeGenerated >= ago(30d)
| where RelatedAnalyticRuleIds has '7ec37e0e-5f7e-462d-8f5c-8225ad0fbdaa'
| project TimeGenerated, Title, Severity, Status
| take 20
```

**6. User Sign-in Timeline**:
```kql
SigninLogs
| where TimeGenerated >= ago(7d)
| where UserPrincipalName == "user@domain.com"
| project TimeGenerated, AppDisplayName, IPAddress, Location, ResultType
| order by TimeGenerated desc
```

### Query Optimization Tips

1. **Always use TimeGenerated filter**: Improves performance dramatically
2. **Limit results early**: Use `take` or `top` to prevent large result sets
3. **Filter before project**: Apply `where` clauses before `project`
4. **Use summarize**: Aggregate data instead of returning raw rows when possible
5. **Avoid wildcards**: Specific column names perform better than `*`

---

## Deployment Guide

### Azure App Service Deployment

**1. Build Production Bundle**:
```bash
ng build --configuration production
```

**2. Deploy to Azure App Service**:
```bash
# Using Azure CLI
az webapp up --name sct-app --resource-group sct-rg --location eastus --html
```

**3. Configure Environment Variables** (Azure Portal):
- Application Settings → New application setting
- Add environment-specific values
- Restart app service

### Azure Static Web Apps Deployment

**1. Create Static Web App**:
```bash
az staticwebapp create \
  --name sct-static \
  --resource-group sct-rg \
  --location eastus2 \
  --source https://github.com/VaishanviM23/SCT \
  --branch main \
  --app-location "/SCT-UI" \
  --output-location "dist/sct-ui"
```

**2. Configure GitHub Actions** (auto-generated):
```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          app_location: "/SCT-UI"
          output_location: "dist/sct-ui"
```

### Production Checklist

- [ ] Update environment.prod.ts with production values
- [ ] Remove console.log statements
- [ ] Enable production mode in Angular
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure Application Insights
- [ ] Set up Azure CDN
- [ ] Configure CORS policies
- [ ] Test authentication flow
- [ ] Verify API connectivity
- [ ] Load test application
- [ ] Set up monitoring alerts
- [ ] Configure backup and disaster recovery

---

## Troubleshooting

### Common Issues

**Issue 1: Authentication Fails**
```
Error: AADSTS50020: User account from identity provider does not exist in tenant
```
**Solution**:
- Verify clientId and authority in environment.ts
- Check Azure AD app registration settings
- Ensure user is in correct tenant
- Verify redirect URIs match

**Issue 2: Log Analytics Query Fails**
```
Error: 403 Forbidden - The user does not have permission to query this workspace
```
**Solution**:
- Grant "Log Analytics Reader" role to user
- Grant "Microsoft Sentinel Reader" role
- Verify workspace ID is correct
- Check token scopes include `https://api.loganalytics.io/.default`

**Issue 3: OpenAI Rate Limiting**
```
Error: 429 Too Many Requests - Rate limit exceeded
```
**Solution**:
- Implement exponential backoff
- Reduce query frequency
- Increase Azure OpenAI quota
- Optimize prompts to use fewer tokens

**Issue 4: CORS Errors**
```
Error: Access to fetch has been blocked by CORS policy
```
**Solution**:
- Configure CORS in Azure services
- Add localhost to allowed origins (dev)
- Verify API endpoints are correct
- Check authentication headers

### Debug Mode

Enable verbose logging:

```typescript
// In environment.ts
export const environment = {
  production: false,
  debug: true,  // Enable debug logging
  msalLogger: {
    config: {
      level: LogLevel.Verbose,
      piiLoggingEnabled: false
    }
  }
};
```

### Browser Console Debugging

```typescript
// View MSAL accounts
console.log(this.msalService.instance.getAllAccounts());

// View token cache
console.log(localStorage.getItem('msal.token.keys'));

// Test API call
this.http.get('https://api.loganalytics.io/v1/workspaces/{id}/query', {
  headers: { Authorization: `Bearer ${token}` }
}).subscribe(console.log, console.error);
```

---

## Performance Optimization

### Bundle Size Optimization

**Lazy Loading Routes**:
```typescript
const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./screens/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  }
];
```

**Tree Shaking**:
- Use Angular production build (automatically tree-shakes)
- Import only required Angular Material modules
- Avoid importing entire libraries

**Build Analysis**:
```bash
# Analyze bundle size
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/sct-ui/stats.json
```

### Runtime Performance

**OnPush Change Detection**:
```typescript
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

**Virtual Scrolling** (for large lists):
```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

<cdk-virtual-scroll-viewport itemSize="50">
  <div *cdkVirtualFor="let item of items">{{item}}</div>
</cdk-virtual-scroll-viewport>
```

**Subscription Management**:
```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## Monitoring and Logging

### Application Insights Integration

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: 'YOUR_KEY',
    enableAutoRouteTracking: true
  }
});

appInsights.loadAppInsights();
appInsights.trackPageView();
```

### Custom Event Tracking

```typescript
// Track user queries
appInsights.trackEvent({
  name: 'SentriBot_Query',
  properties: {
    query: userQuery,
    timestamp: new Date(),
    userId: currentUser.id
  }
});

// Track errors
appInsights.trackException({
  exception: new Error('Query failed'),
  severityLevel: SeverityLevel.Error
});
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Audience**: Developers, DevOps Engineers, Technical Staff  
**Purpose**: Technical reference and implementation guide
