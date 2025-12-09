# High-Level Design (HLD) - Security Control Tower (SCT)

## Executive Summary

The Security Control Tower (SCT) is an enterprise-grade security monitoring and analysis platform that provides a unified interface for security teams to monitor, analyze, and respond to security threats across their Azure infrastructure. The system integrates with Microsoft Sentinel, Azure OpenAI, and Power BI to deliver AI-powered security insights and interactive dashboards.

## System Overview

### Purpose
The SCT platform serves as a centralized security operations center that:
- Aggregates security data from multiple sources (Qualys, Microsoft XDR, Azure AD, etc.)
- Provides AI-powered natural language query capabilities for security analysts
- Delivers interactive visualizations and dashboards for security metrics
- Enables rapid threat detection and incident response
- Tracks vulnerabilities (CVEs) across applications and infrastructure

### Target Users
- **Security Operations Center (SOC) Analysts**: Primary users who investigate incidents and analyze threats
- **Security Managers**: Monitor overall security posture and track metrics
- **Incident Response Teams**: Investigate and respond to security incidents
- **Compliance Teams**: Track compliance status and governance metrics
- **IT Administrators**: Monitor system health and connected services

## Business Capabilities

### 1. Security Incident Management
The platform provides comprehensive incident tracking and analysis capabilities:
- **Multi-Source Incident Correlation**: Aggregates incidents from Qualys vulnerability scans, Microsoft XDR alerts, and other security tools
- **CVE Tracking**: Monitors Common Vulnerabilities and Exposures (CVEs) across all applications
- **Severity Classification**: Categorizes incidents by severity (Critical, High, Medium, Low, Informational)
- **Incident Lifecycle Management**: Tracks incidents from detection through resolution

### 2. AI-Powered Security Analysis (SentriBot)
The SentriBot feature enables natural language querying of security data:
- **Natural Language Processing**: Convert security questions into KQL queries automatically
- **User Risk Analysis**: Identify high-risk users based on behavioral anomalies and sign-in patterns
- **Threat Intelligence**: Analyze security events using AI to identify patterns and threats
- **Contextual Recommendations**: Provide actionable security recommendations based on findings

### 3. Security Posture Management
Monitor and improve overall security posture:
- **Microsoft Secure Score Integration**: Track security score across Identity, Data, Device, Apps, and Cloud categories
- **Performance Metrics**: Monitor Mean Time to Remediate (MTTR) and SLA compliance
- **Connected Systems Health**: Track integration status with external security tools
- **AI-Driven Insights**: Predictive analysis and anomaly detection

### 4. Interactive Security Dashboards
Power BI integration for visual analytics:
- **Threat & Incident Reports**: Comprehensive view of security incidents and trends
- **Identity & Access Management**: Monitor authentication events and access patterns
- **Asset & Endpoint Security**: Track device security status and compliance
- **Cloud Workload Security**: Monitor cloud infrastructure security
- **Compliance & Governance**: Track regulatory compliance and policy adherence

## High-Level Architecture

### Architecture Style
The application follows a **Single Page Application (SPA)** architecture pattern with the following characteristics:
- **Frontend**: Angular 18-based web application
- **Authentication**: Azure AD B2C with MSAL (Microsoft Authentication Library)
- **Data Access**: REST APIs for Azure Log Analytics, Azure OpenAI, and Power BI
- **State Management**: RxJS-based reactive state management
- **Security**: Token-based authentication with OAuth 2.0/OpenID Connect

### System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Control Tower                     │
│                      (Angular SPA)                           │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │SentriBot │  │Overview  │  │  Auth    │  │
│  │  Views   │  │  (AI)    │  │  Page    │  │  Layer   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
└───────────────────────┬──────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Azure AD   │ │Log Analytics │ │ Azure OpenAI │
│   (MSAL)     │ │  /Sentinel   │ │   Service    │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        │               ▼               │
        │       ┌──────────────┐       │
        │       │   Power BI   │       │
        │       │   Embedded   │       │
        │       └──────────────┘       │
        │                              │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────┐            ┌──────────────┐
│   External   │            │  Microsoft   │
│   Security   │            │     365      │
│    Tools     │            │   Defender   │
│  (Qualys,    │            │     XDR      │
│ CrowdStrike, │            └──────────────┘
│  Tenable)    │
└──────────────┘
```

## Key Architectural Components

### 1. Presentation Layer (Angular Frontend)
- **Routing Module**: Manages navigation between different security views
- **Component Library**: Reusable Angular Material components for consistent UI
- **State Management**: RxJS observables for reactive data flow
- **Authentication Guard**: MSAL-based route protection

### 2. Service Layer
- **AuthService**: Manages Azure AD authentication and token acquisition
- **SentinelQueryService**: Orchestrates natural language to KQL conversion
- **LogAnalyticsService**: Executes KQL queries against Azure Sentinel
- **OpenAIService**: Interfaces with Azure OpenAI for AI capabilities
- **SidebarService**: Manages UI state for navigation

### 3. Integration Layer
- **MSAL Integration**: Seamless authentication with Azure AD
- **Log Analytics API**: Direct access to Microsoft Sentinel data
- **Azure OpenAI API**: AI-powered query generation and analysis
- **Power BI Embedded**: Interactive dashboard rendering

### 4. Data Layer
- **Microsoft Sentinel**: Central security data warehouse
  - SecurityIncident table: Incident records from all sources
  - AADUserRiskEvents: User risk and behavioral analytics
  - SigninLogs: Authentication events
  - SecurityAlert: Real-time security alerts
  - ThreatIntelligenceIndicator: Threat intelligence data

## Integration Points

### Internal Integrations
1. **Azure Active Directory B2C**
   - Purpose: User authentication and authorization
   - Protocol: OAuth 2.0 / OpenID Connect
   - Token Management: MSAL library handles token lifecycle

2. **Azure Log Analytics / Microsoft Sentinel**
   - Purpose: Security data repository and query engine
   - Protocol: REST API with OAuth bearer tokens
   - Query Language: KQL (Kusto Query Language)

3. **Azure OpenAI Service**
   - Purpose: AI-powered query generation and analysis
   - Protocol: REST API with API key authentication
   - Model: GPT-4o deployment

4. **Power BI Embedded**
   - Purpose: Interactive security dashboards
   - Protocol: Power BI Embedded REST API
   - Authentication: Embed tokens

### External Integrations
1. **Qualys Vulnerability Management**
   - Integration Type: Analytics rule-based ingestion
   - Data: CVE vulnerabilities, scan results
   - Identifier: Rule ID 7ec37e0e-5f7e-462d-8f5c-8225ad0fbdaa

2. **Microsoft 365 Defender XDR**
   - Integration Type: Native Microsoft integration
   - Data: Endpoint security alerts, threat intelligence
   - Identifier: Rule ID 6d1f212d-4e30-4d67-916d-584475ed2ed4

3. **Third-Party Security Tools**
   - CrowdStrike: Endpoint detection and response
   - Rapid7: Vulnerability scanning and assessment
   - Tenable: Infrastructure vulnerability management
   - ServiceNow: Incident ticketing integration

## Security Architecture

### Authentication Flow
1. User navigates to SCT application
2. MSAL redirects to Azure AD login page
3. User authenticates with corporate credentials
4. Azure AD issues access token with appropriate scopes
5. Application stores token securely in localStorage
6. Protected routes verify authentication via MsalGuard
7. API calls include bearer token in Authorization header

### Authorization Model
- **Role-Based Access Control (RBAC)**: Uses Azure AD roles
- **Required Permissions**:
  - Microsoft Sentinel Reader
  - Log Analytics Reader
  - Power BI viewer/consumer
  - Azure OpenAI user

### Data Security
- **In-Transit**: All communications use HTTPS/TLS
- **At-Rest**: Data stored in Azure services with encryption
- **Token Storage**: Secure localStorage with MSAL token cache
- **API Keys**: Configured in environment variables (not in source code)

## Scalability Considerations

### Performance Optimization
- **Query Result Limiting**: All KQL queries limited to prevent large data transfers
- **Caching Strategy**: Browser caching for static assets
- **Lazy Loading**: Route-based code splitting for faster initial load
- **Token Caching**: MSAL manages token refresh automatically

### Rate Limiting
- **Log Analytics API**: Rate limits enforced at Azure platform level
- **Azure OpenAI**: Rate limiting and retry logic built into service
- **Query Validation**: Pre-execution validation to prevent expensive queries

## Deployment Architecture

### Environment Strategy
- **Development**: Local development with environment-specific configuration
- **Production**: Azure-hosted with CDN distribution
- **Configuration Management**: Environment-specific settings in environment.ts files

### Infrastructure Requirements
- **Azure Active Directory B2C**: Tenant configuration
- **Azure Log Analytics Workspace**: Sentinel-enabled workspace
- **Azure OpenAI Service**: GPT-4o deployment
- **Power BI Workspace**: Dashboard hosting
- **Web Hosting**: Azure App Service or Static Web Apps

## Disaster Recovery

### Backup Strategy
- **Configuration**: Source control in GitHub
- **Security Data**: Replicated in Azure Log Analytics
- **User Data**: Managed by Azure AD

### Recovery Procedures
- **Application Failure**: Redeploy from source control
- **Service Outage**: Fallback to read-only mode if Azure services unavailable
- **Data Loss**: Azure services provide built-in data durability

## Monitoring and Observability

### Application Monitoring
- **Browser Console Logging**: Detailed logging for debugging
- **MSAL Logger**: Authentication flow monitoring
- **API Call Tracing**: Request/response logging for all service calls

### Performance Monitoring
- **Load Times**: Track initial page load and route transitions
- **API Response Times**: Monitor query execution time
- **Error Rates**: Track failed API calls and authentication errors

## Compliance and Governance

### Data Residency
- All data processed within Azure tenant boundaries
- Compliance with regional data sovereignty requirements

### Audit Trail
- All security queries logged in Azure Log Analytics
- Authentication events tracked by Azure AD
- User actions auditable through application logs

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | Angular | 18.x | SPA development |
| UI Components | Angular Material | 18.x | Material Design components |
| Authentication | MSAL Angular | 4.x | Azure AD integration |
| State Management | RxJS | 7.8 | Reactive programming |
| HTTP Client | HttpClient | Angular | API communication |
| Markdown Rendering | Custom Pipe | N/A | Display formatted results |
| Data Visualization | Power BI Client | 2.23 | Embedded dashboards |
| AI Services | Azure OpenAI | GPT-4o | Natural language processing |
| Security Data | Azure Sentinel | N/A | Security analytics |

## Success Metrics

### Business Metrics
- Mean Time to Detect (MTTD): Target < 15 minutes
- Mean Time to Respond (MTTR): Target < 4 hours for critical incidents
- Security Score Improvement: Target > 70%
- Incident Investigation Efficiency: 50% reduction in query time

### Technical Metrics
- Application Availability: 99.9% uptime
- Page Load Time: < 3 seconds
- API Response Time: < 2 seconds for queries
- Authentication Success Rate: > 99%

## Future Roadmap

### Planned Enhancements
1. **Machine Learning Integration**: Automated incident classification
2. **Mobile Application**: Native mobile app for on-call analysts
3. **Workflow Automation**: Automated response playbooks
4. **Enhanced Reporting**: Custom report builder
5. **Multi-Tenancy Support**: Support for multiple organizations
6. **Advanced Threat Hunting**: Guided hunting experiences
7. **Collaboration Features**: Team-based incident investigation

## Glossary

- **SCT**: Security Control Tower - The application name
- **SentriBot**: AI-powered security analysis assistant
- **KQL**: Kusto Query Language - Query language for Azure services
- **MSAL**: Microsoft Authentication Library
- **CVE**: Common Vulnerabilities and Exposures
- **MTTR**: Mean Time to Remediate
- **MTTD**: Mean Time to Detect
- **XDR**: Extended Detection and Response
- **SOC**: Security Operations Center
- **RBAC**: Role-Based Access Control
- **SPA**: Single Page Application

## References

- [Microsoft Sentinel Documentation](https://docs.microsoft.com/azure/sentinel/)
- [Azure OpenAI Service](https://docs.microsoft.com/azure/cognitive-services/openai/)
- [MSAL Angular Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [KQL Language Reference](https://docs.microsoft.com/azure/data-explorer/kusto/query/)
- [Angular Documentation](https://angular.io/docs)
- [Power BI Embedded](https://docs.microsoft.com/power-bi/developer/embedded/)
