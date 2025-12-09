# C4 Architecture Diagrams - Security Control Tower

This document contains C4 model diagrams for the Security Control Tower application using Mermaid syntax.

## Table of Contents
1. [Level 1: System Context Diagram](#level-1-system-context-diagram)
2. [Level 2: Container Diagram](#level-2-container-diagram)
3. [Level 3: Component Diagram](#level-3-component-diagram)
4. [Sequence Diagrams](#sequence-diagrams)
5. [Flow Diagrams](#flow-diagrams)

---

## Level 1: System Context Diagram

This diagram shows the Security Control Tower system and its relationships with users and external systems.

```mermaid
graph TB
    User[Security Analyst<br/>Monitors security threats<br/>and investigates incidents]
    
    SCT[Security Control Tower<br/>Web Application<br/>Provides AI powered security<br/>monitoring and analysis]
    
    AzureAD[Azure Active Directory<br/>Authentication Service<br/>Manages user authentication<br/>and authorization]
    
    Sentinel[Microsoft Sentinel<br/>Security Platform<br/>Collects and stores<br/>security data]
    
    OpenAI[Azure OpenAI Service<br/>AI Platform<br/>Provides natural language<br/>processing capabilities]
    
    PowerBI[Power BI Service<br/>Reporting Platform<br/>Hosts security dashboards<br/>and reports]
    
    Qualys[Qualys<br/>Vulnerability Scanner<br/>Provides CVE data]
    
    M365Defender[Microsoft 365 Defender<br/>XDR Platform<br/>Provides endpoint<br/>security data]
    
    CrowdStrike[CrowdStrike<br/>EDR Platform<br/>Endpoint detection<br/>and response]
    
    User -->|Uses web browser| SCT
    SCT -->|Authenticates users via| AzureAD
    SCT -->|Queries security data from| Sentinel
    SCT -->|Generates queries using| OpenAI
    SCT -->|Displays dashboards from| PowerBI
    Sentinel -->|Ingests vulnerability data from| Qualys
    Sentinel -->|Ingests threat data from| M365Defender
    Sentinel -->|Ingests endpoint data from| CrowdStrike
    
    style SCT fill:#1168bd,stroke:#0b4884,color:#ffffff
    style User fill:#08427b,stroke:#052e56,color:#ffffff
```

---

## Level 2: Container Diagram

This diagram shows the high-level technology choices and how containers communicate.

```mermaid
graph TB
    User[Security Analyst<br/>Browser]
    
    subgraph SCT_System[Security Control Tower System]
        WebApp[Angular SPA<br/>TypeScript JavaScript HTML CSS<br/>User interface for security<br/>monitoring and analysis]
        
        MSAL[MSAL Library<br/>JavaScript Library<br/>Handles authentication<br/>and token management]
    end
    
    subgraph Azure_Services[Azure Services]
        AzureAD[Azure AD B2C<br/>Identity Platform<br/>User authentication<br/>and authorization]
        
        LogAnalytics[Log Analytics API<br/>REST API<br/>Executes KQL queries<br/>against Sentinel data]
        
        OpenAI_API[Azure OpenAI API<br/>REST API<br/>Natural language to<br/>KQL conversion]
        
        PowerBI_API[Power BI Embed API<br/>REST API<br/>Embeds dashboards<br/>and reports]
    end
    
    subgraph Data_Sources[Data Sources]
        Sentinel[Microsoft Sentinel<br/>Security Data Lake<br/>Stores security events<br/>incidents and alerts]
        
        Qualys[Qualys<br/>Vulnerability Data]
        
        M365[M365 Defender<br/>Threat Data]
    end
    
    User -->|HTTPS| WebApp
    WebApp -->|OAuth 2.0| MSAL
    MSAL -->|OpenID Connect| AzureAD
    WebApp -->|HTTPS REST JSON Bearer Token| LogAnalytics
    WebApp -->|HTTPS REST JSON API Key| OpenAI_API
    WebApp -->|HTTPS REST JSON Bearer Token| PowerBI_API
    LogAnalytics -->|KQL Queries| Sentinel
    Sentinel -->|Data Ingestion| Qualys
    Sentinel -->|Data Ingestion| M365
    
    style WebApp fill:#1168bd,stroke:#0b4884,color:#ffffff
    style MSAL fill:#438dd5,stroke:#2e6295,color:#ffffff
```

---

## Level 3: Component Diagram

This diagram shows the internal components of the Angular SPA container.

```mermaid
graph TB
    subgraph Presentation_Layer[Presentation Layer]
        Dashboard[Dashboard Component<br/>Displays Power BI reports<br/>for security metrics]
        
        SentriBot[SentriBot Component<br/>AI chat interface for<br/>natural language queries]
        
        Overview[Overview Component<br/>Security posture<br/>and AI insights]
        
        Header[Header Component<br/>User profile and<br/>navigation]
        
        Main[Main Component<br/>Layout container and<br/>router outlet]
    end
    
    subgraph Service_Layer[Service Layer]
        AuthSvc[Auth Service<br/>Manages authentication<br/>and token acquisition]
        
        QuerySvc[Sentinel Query Service<br/>Orchestrates NL to KQL<br/>query processing]
        
        LogSvc[Log Analytics Service<br/>Executes KQL queries<br/>against Sentinel]
        
        OpenAISvc[OpenAI Service<br/>Interfaces with Azure<br/>OpenAI for AI features]
        
        SidebarSvc[Sidebar Service<br/>Manages UI state<br/>for navigation]
    end
    
    subgraph Data_Layer[Data Layer]
        Models[MCP Models<br/>TypeScript interfaces<br/>for data structures]
    end
    
    subgraph External_APIs[External APIs]
        AzureAD[Azure AD<br/>Authentication]
        
        LogAPI[Log Analytics API<br/>Query Execution]
        
        OpenAI_API[Azure OpenAI<br/>NLP Processing]
        
        PowerBI_API[Power BI API<br/>Dashboard Embedding]
    end
    
    Dashboard -->|Uses| AuthSvc
    Dashboard -->|Calls| PowerBI_API
    
    SentriBot -->|Uses| QuerySvc
    QuerySvc -->|Uses| OpenAISvc
    QuerySvc -->|Uses| LogSvc
    
    Overview -->|Displays| Models
    
    Header -->|Uses| AuthSvc
    Header -->|Uses| SidebarSvc
    
    Main -->|Uses| SidebarSvc
    
    AuthSvc -->|Authenticates| AzureAD
    LogSvc -->|Queries| LogAPI
    LogSvc -->|Uses| AuthSvc
    OpenAISvc -->|Calls| OpenAI_API
    
    QuerySvc -->|Uses| Models
    LogSvc -->|Uses| Models
    OpenAISvc -->|Uses| Models
    
    style SentriBot fill:#1168bd,stroke:#0b4884,color:#ffffff
    style QuerySvc fill:#1168bd,stroke:#0b4884,color:#ffffff
```

---

## Sequence Diagrams

### User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant SCT_App as SCT Angular App
    participant MSAL
    participant Azure_AD as Azure AD
    
    User->>Browser: Navigate to SCT
    Browser->>SCT_App: GET /
    SCT_App->>MSAL: Check authentication
    MSAL->>MSAL: Check token cache
    
    alt Not Authenticated
        MSAL->>Azure_AD: Redirect to login
        Azure_AD->>User: Show login page
        User->>Azure_AD: Enter credentials
        Azure_AD->>Azure_AD: Validate credentials
        Azure_AD->>MSAL: Return auth code
        MSAL->>Azure_AD: Exchange code for tokens
        Azure_AD->>MSAL: Return access and ID tokens
        MSAL->>MSAL: Store in cache
        MSAL->>SCT_App: Authentication success
        SCT_App->>Browser: Display dashboard
    else Already Authenticated
        MSAL->>SCT_App: Return cached tokens
        SCT_App->>Browser: Display dashboard
    end
```

### SentriBot Query Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant SentriBot as SentriBot Component
    participant QuerySvc as Sentinel Query Service
    participant OpenAI as OpenAI Service
    participant LogSvc as Log Analytics Service
    participant Sentinel as Microsoft Sentinel
    
    User->>SentriBot: Enter natural language query
    SentriBot->>QuerySvc: querySentinel(query)
    
    QuerySvc->>OpenAI: chatCompletion(messages, functions)
    Note over OpenAI: System prompt includes<br/>security context and<br/>available tables
    OpenAI->>OpenAI: Analyze query intent
    OpenAI->>QuerySvc: Function call: query_sentinel_data
    Note over QuerySvc: Parse function arguments<br/>to extract KQL query
    
    QuerySvc->>QuerySvc: validateKqlQuery(kql)
    
    alt Valid Query
        QuerySvc->>LogSvc: executeQuery(kql, timespan)
        LogSvc->>LogSvc: Acquire auth token
        LogSvc->>Sentinel: POST query with token
        Sentinel->>Sentinel: Execute KQL query
        Sentinel->>LogSvc: Return results (columnar format)
        LogSvc->>LogSvc: Parse and transform results
        LogSvc->>QuerySvc: Return QueryResult
        
        QuerySvc->>OpenAI: chatCompletion(messages + results)
        Note over OpenAI: Analyze results and<br/>generate insights
        OpenAI->>QuerySvc: Formatted analysis response
        QuerySvc->>SentriBot: SentinelQueryResult
        SentriBot->>User: Display formatted response
    else Invalid Query
        QuerySvc->>SentriBot: Error result
        SentriBot->>User: Display error message
    end
```

### Token Acquisition Flow

```mermaid
sequenceDiagram
    participant Component
    participant AuthSvc as Auth Service
    participant MSAL
    participant Azure_AD as Azure AD
    participant API as External API
    
    Component->>AuthSvc: getLogAnalyticsToken()
    AuthSvc->>MSAL: acquireTokenSilent(scopes)
    
    MSAL->>MSAL: Check token cache
    
    alt Token in cache and valid
        MSAL->>AuthSvc: Return cached token
    else Token expired
        MSAL->>Azure_AD: Refresh token request
        Azure_AD->>MSAL: Return new access token
        MSAL->>MSAL: Update cache
        MSAL->>AuthSvc: Return new token
    else No cached token
        MSAL->>Azure_AD: Interactive login popup
        Azure_AD->>MSAL: Return tokens
        MSAL->>MSAL: Store in cache
        MSAL->>AuthSvc: Return access token
    end
    
    AuthSvc->>Component: Return token
    Component->>API: API call with Bearer token
    API->>Component: API response
```

### Power BI Dashboard Embedding Flow

```mermaid
sequenceDiagram
    participant User
    participant Dashboard as Dashboard Component
    participant AuthSvc as Auth Service
    participant PowerBI_API as Power BI API
    participant PowerBI_Svc as Power BI Service
    
    User->>Dashboard: Navigate to dashboard route
    Dashboard->>Dashboard: ngAfterViewInit()
    Dashboard->>AuthSvc: getPowerBiAccessToken()
    AuthSvc->>AuthSvc: Acquire token with Power BI scopes
    AuthSvc->>Dashboard: Return embed token
    
    Dashboard->>Dashboard: Configure embed settings
    Note over Dashboard: Set report ID, embed URL,<br/>token, and display options
    
    Dashboard->>PowerBI_API: Initialize Power BI service
    Dashboard->>PowerBI_API: embed(container, config)
    PowerBI_API->>PowerBI_Svc: Request report with token
    PowerBI_Svc->>PowerBI_Svc: Validate token
    PowerBI_Svc->>PowerBI_API: Return embedded report
    PowerBI_API->>Dashboard: Render in iframe
    Dashboard->>User: Display interactive report
```

---

## Flow Diagrams

### User Risk Analysis Flow

```mermaid
flowchart TD
    Start([User asks about risky users])
    
    Input[Natural Language Input<br/>Example: Find top 3 risky users]
    
    SendToAI[Send to Azure OpenAI<br/>with system prompt and<br/>available functions]
    
    AIDecision{OpenAI decides<br/>to call function?}
    
    GenerateKQL[OpenAI generates KQL:<br/>AADUserRiskEvents query<br/>with aggregations]
    
    Validate[Validate KQL query<br/>Check filters, limits,<br/>table names]
    
    ValidCheck{Query valid?}
    
    Execute[Execute query via<br/>Log Analytics API]
    
    ParseResults[Parse columnar results<br/>Transform to objects]
    
    SendResults[Send results back<br/>to OpenAI for analysis]
    
    FormatResponse[OpenAI formats response:<br/>- Executive summary<br/>- User details<br/>- Risk assessment<br/>- Recommendations]
    
    Display[Display markdown<br/>formatted response]
    
    Error[Display error message<br/>with troubleshooting]
    
    Clarify[Request clarification<br/>from user]
    
    End([End])
    
    Start --> Input
    Input --> SendToAI
    SendToAI --> AIDecision
    
    AIDecision -->|Yes| GenerateKQL
    AIDecision -->|No| Clarify
    
    GenerateKQL --> Validate
    Validate --> ValidCheck
    
    ValidCheck -->|Valid| Execute
    ValidCheck -->|Invalid| Error
    
    Execute --> ParseResults
    ParseResults --> SendResults
    SendResults --> FormatResponse
    FormatResponse --> Display
    
    Display --> End
    Error --> End
    Clarify --> End
    
    style Start fill:#90EE90
    style End fill:#FFB6C1
    style GenerateKQL fill:#87CEEB
    style FormatResponse fill:#87CEEB
    style Error fill:#FFB6C1
```

### Multi-Source Incident Correlation Flow

```mermaid
flowchart TD
    Start([User queries incidents])
    
    Query[User Query:<br/>Show Qualys incidents<br/>or CVE specific query]
    
    AIAnalysis[AI analyzes query intent<br/>Identifies need for<br/>source filtering]
    
    SourceDetect{Which source?}
    
    QualysKQL[Generate KQL with<br/>Qualys Rule ID filter:<br/>7ec37e0e-5f7e-462d-8f5c-8225ad0fbdaa]
    
    XDRKQL[Generate KQL with<br/>XDR Rule ID filter:<br/>6d1f212d-4e30-4d67-916d-584475ed2ed4]
    
    CVEKQL[Generate KQL with<br/>CVE pattern matching<br/>Title contains CVE ID]
    
    AllSourcesKQL[Generate KQL for<br/>all SecurityIncident<br/>records]
    
    ExecuteQuery[Execute KQL query<br/>against Sentinel]
    
    ParseIncidents[Parse incidents<br/>Extract CVE IDs<br/>Extract app names]
    
    CorrelateSources[Correlate data<br/>across sources if needed]
    
    AIAnalyze[AI analyzes results:<br/>- Incident patterns<br/>- CVE severity<br/>- Affected apps<br/>- Recommendations]
    
    FormatOutput[Format output with:<br/>- Summary statistics<br/>- Source breakdown<br/>- CVE details<br/>- Action items]
    
    Display[Display results<br/>to user]
    
    End([End])
    
    Start --> Query
    Query --> AIAnalysis
    AIAnalysis --> SourceDetect
    
    SourceDetect -->|Qualys| QualysKQL
    SourceDetect -->|XDR| XDRKQL
    SourceDetect -->|CVE Specific| CVEKQL
    SourceDetect -->|All| AllSourcesKQL
    
    QualysKQL --> ExecuteQuery
    XDRKQL --> ExecuteQuery
    CVEKQL --> ExecuteQuery
    AllSourcesKQL --> ExecuteQuery
    
    ExecuteQuery --> ParseIncidents
    ParseIncidents --> CorrelateSources
    CorrelateSources --> AIAnalyze
    AIAnalyze --> FormatOutput
    FormatOutput --> Display
    Display --> End
    
    style Start fill:#90EE90
    style End fill:#FFB6C1
    style AIAnalysis fill:#87CEEB
    style AIAnalyze fill:#87CEEB
```

### Application Initialization Flow

```mermaid
flowchart TD
    Start([Application Start])
    
    LoadApp[Browser loads<br/>Angular application]
    
    Bootstrap[Bootstrap AppModule<br/>Initialize MSAL]
    
    CreateMSAL[Create MSAL instance<br/>with configuration]
    
    SetupInterceptors[Setup HTTP interceptors<br/>for automatic token injection]
    
    InitRouting[Initialize routing<br/>with MsalGuard]
    
    CheckAuth{User<br/>authenticated?}
    
    LoadCachedToken[Load cached token<br/>from localStorage]
    
    ValidateToken{Token<br/>valid?}
    
    RedirectLogin[Redirect to<br/>Azure AD login]
    
    UserLogin[User enters<br/>credentials]
    
    ReceiveToken[Receive and cache<br/>access tokens]
    
    NavigateApp[Navigate to<br/>default route]
    
    LoadComponents[Load route components<br/>Dashboard, SentriBot, etc]
    
    InitServices[Initialize services<br/>with dependencies]
    
    Ready[Application ready<br/>for user interaction]
    
    End([End])
    
    Start --> LoadApp
    LoadApp --> Bootstrap
    Bootstrap --> CreateMSAL
    CreateMSAL --> SetupInterceptors
    SetupInterceptors --> InitRouting
    InitRouting --> CheckAuth
    
    CheckAuth -->|Yes| LoadCachedToken
    CheckAuth -->|No| RedirectLogin
    
    LoadCachedToken --> ValidateToken
    
    ValidateToken -->|Valid| NavigateApp
    ValidateToken -->|Expired| RedirectLogin
    
    RedirectLogin --> UserLogin
    UserLogin --> ReceiveToken
    ReceiveToken --> NavigateApp
    
    NavigateApp --> LoadComponents
    LoadComponents --> InitServices
    InitServices --> Ready
    Ready --> End
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style Ready fill:#90EE90
    style RedirectLogin fill:#FFD700
```

### Error Handling Flow

```mermaid
flowchart TD
    Start([API Call Initiated])
    
    MakeRequest[Make HTTP request<br/>with bearer token]
    
    ReceiveResponse{Response<br/>status?}
    
    Success[200 OK<br/>Parse successful response]
    
    Auth401[401 Unauthorized<br/>Token invalid or expired]
    
    Forbidden403[403 Forbidden<br/>Insufficient permissions]
    
    NotFound404[404 Not Found<br/>Resource does not exist]
    
    RateLimit429[429 Too Many Requests<br/>Rate limit exceeded]
    
    ServerError5xx[5xx Server Error<br/>Service unavailable]
    
    RetryToken[Attempt token refresh<br/>via MSAL]
    
    TokenSuccess{Token<br/>refreshed?}
    
    RetryRequest[Retry original<br/>request with new token]
    
    ShowAuthError[Show authentication<br/>error message]
    
    ShowPermError[Show permission error<br/>Required: Sentinel Reader<br/>Log Analytics Reader]
    
    ShowNotFoundError[Show resource error<br/>Verify workspace ID<br/>and configuration]
    
    WaitAndRetry[Wait with exponential<br/>backoff and retry]
    
    RetrySuccess{Retry<br/>successful?}
    
    ShowRateLimitError[Show rate limit error<br/>Reduce query frequency]
    
    ShowServerError[Show server error<br/>Service temporarily<br/>unavailable]
    
    ProcessSuccess[Process successful<br/>response data]
    
    LogError[Log error details<br/>for debugging]
    
    DisplayError[Display user friendly<br/>error message]
    
    End([End])
    
    Start --> MakeRequest
    MakeRequest --> ReceiveResponse
    
    ReceiveResponse -->|200| Success
    ReceiveResponse -->|401| Auth401
    ReceiveResponse -->|403| Forbidden403
    ReceiveResponse -->|404| NotFound404
    ReceiveResponse -->|429| RateLimit429
    ReceiveResponse -->|5xx| ServerError5xx
    
    Success --> ProcessSuccess
    ProcessSuccess --> End
    
    Auth401 --> RetryToken
    RetryToken --> TokenSuccess
    
    TokenSuccess -->|Yes| RetryRequest
    TokenSuccess -->|No| ShowAuthError
    
    RetryRequest --> ReceiveResponse
    ShowAuthError --> LogError
    
    Forbidden403 --> ShowPermError
    ShowPermError --> LogError
    
    NotFound404 --> ShowNotFoundError
    ShowNotFoundError --> LogError
    
    RateLimit429 --> WaitAndRetry
    WaitAndRetry --> RetrySuccess
    
    RetrySuccess -->|Yes| MakeRequest
    RetrySuccess -->|No| ShowRateLimitError
    
    ShowRateLimitError --> LogError
    
    ServerError5xx --> ShowServerError
    ShowServerError --> LogError
    
    LogError --> DisplayError
    DisplayError --> End
    
    style Success fill:#90EE90
    style ProcessSuccess fill:#90EE90
    style ShowAuthError fill:#FFB6C1
    style ShowPermError fill:#FFB6C1
    style ShowNotFoundError fill:#FFB6C1
    style ShowRateLimitError fill:#FFB6C1
    style ShowServerError fill:#FFB6C1
```

---

## Class Diagram

```mermaid
classDiagram
    class AuthService {
        -msalService: MsalService
        +getCurrentUser() AccountInfo
        +isAuthenticated() boolean
        +getPowerBiAccessToken() Promise~string~
        +getLogAnalyticsToken() Promise~AuthenticationResult~
        +login() void
        +logout() void
    }
    
    class LogAnalyticsService {
        -http: HttpClient
        -authService: AuthService
        -workspaceId: string
        -baseUrl: string
        +executeQuery(kqlQuery, timespan) Observable~QueryResult~
        -getAccessToken() Observable~string~
        -parseResponse(query, response) QueryResult
    }
    
    class OpenAIService {
        -http: HttpClient
        -apiUrl: string
        -apiKey: string
        -model: string
        +chatCompletion(messages, functions) Observable~OpenAIChatResponse~
        +ask(userMessage, systemPrompt) Observable~string~
        -handleError(error) Observable~never~
    }
    
    class SentinelQueryService {
        -openAIService: OpenAIService
        -logAnalyticsService: LogAnalyticsService
        -sentinelFunctions: OpenAIFunction[]
        -systemPrompt: string
        +querySentinel(userQuery) Observable~SentinelQueryResult~
        -validateKqlQuery(query) QueryValidation
        -detectQuerySources(kqlQuery) string[]
    }
    
    class SidebarService {
        -sidebarVisible: BehaviorSubject~boolean~
        +sidebarVisible$: Observable~boolean~
        +toggleSidebar() void
    }
    
    class DashboardComponent {
        -auth: AuthService
        -router: Router
        +route: string
        +account: AccountInfo
        +ngAfterViewInit() void
        +embedReport(accessToken) void
    }
    
    class SentribotComponent {
        -sentinelQueryService: SentinelQueryService
        +query: string
        +results: SentinelQueryResult[]
        +isLoading: boolean
        +exampleQueries: string[]
        +ngOnInit() void
        +submitQuery() void
        +useExampleQuery(example) void
        +clearResults() void
        +onKeyDown(event) void
    }
    
    class OverviewComponent {
        -router: Router
        +secureScore: object
        +aiInsights: object
        +performanceMetrics: object
        +connectedSystems: object
        +navigateTo(route) void
    }
    
    class HeaderComponent {
        -sidebarService: SidebarService
        -authService: AuthService
        +username: string
        +email: string
        +ngOnInit() void
        +toggleSidebar() void
        +logout() void
    }
    
    class MainComponent {
        -sidebarService: SidebarService
        +sidebarVisible: boolean
        +ngOnInit() void
    }
    
    class MarkdownPipe {
        -sanitizer: DomSanitizer
        +transform(value) SafeHtml
    }
    
    SentribotComponent --> SentinelQueryService
    SentinelQueryService --> OpenAIService
    SentinelQueryService --> LogAnalyticsService
    LogAnalyticsService --> AuthService
    DashboardComponent --> AuthService
    HeaderComponent --> AuthService
    HeaderComponent --> SidebarService
    MainComponent --> SidebarService
```

---

## Deployment Diagram

```mermaid
graph TB
    subgraph User_Device[User Device]
        Browser[Web Browser<br/>Chrome, Edge, Firefox]
    end
    
    subgraph Azure_Cloud[Azure Cloud]
        subgraph App_Service[Azure App Service / Static Web Apps]
            WebApp[SCT Angular Application<br/>Static files: HTML, CSS, JS]
        end
        
        subgraph Identity[Identity Services]
            AzureAD[Azure AD B2C<br/>Authentication]
        end
        
        subgraph AI_Services[AI Services]
            OpenAI[Azure OpenAI Service<br/>GPT-4o Deployment]
        end
        
        subgraph Analytics[Analytics Services]
            LogAnalytics[Log Analytics Workspace<br/>Sentinel Enabled]
            PowerBI[Power BI Workspace<br/>Embedded Reports]
        end
        
        subgraph Security_Tools[Integrated Security Tools]
            Qualys_Connector[Qualys Connector]
            M365_Connector[M365 Defender Connector]
            CrowdStrike_Connector[CrowdStrike Connector]
        end
        
        subgraph Monitoring[Monitoring]
            AppInsights[Application Insights<br/>Telemetry and Logging]
        end
    end
    
    Browser -->|HTTPS| WebApp
    WebApp -->|OAuth 2.0 OpenID Connect| AzureAD
    WebApp -->|HTTPS REST API Bearer Token| LogAnalytics
    WebApp -->|HTTPS REST API Key| OpenAI
    WebApp -->|HTTPS REST API Bearer Token| PowerBI
    WebApp -->|Telemetry| AppInsights
    
    LogAnalytics -->|Data Ingestion| Qualys_Connector
    LogAnalytics -->|Data Ingestion| M365_Connector
    LogAnalytics -->|Data Ingestion| CrowdStrike_Connector
    
    style WebApp fill:#1168bd,stroke:#0b4884,color:#ffffff
    style Browser fill:#438dd5,stroke:#2e6295,color:#ffffff
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Format**: Mermaid Diagrams  
**Purpose**: Visual architecture documentation for Security Control Tower
