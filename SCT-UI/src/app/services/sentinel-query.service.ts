import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { OpenAIService } from './openai.service';
import { LogAnalyticsService } from './log-analytics.service';
import { 
  OpenAIMessage, 
  OpenAIFunction, 
  SentinelQueryResult,
  QueryResult
} from '../models/mcp.models';

/**
 * SentriBot - AI-powered Microsoft Sentinel security analysis service
 * Orchestrates Sentinel queries using Azure OpenAI and Log Analytics
 */
@Injectable({
  providedIn: 'root'
})
export class SentinelQueryService {
  
  /**
   * Available functions for OpenAI to call when querying Sentinel data
   */
  private readonly sentinelFunctions: OpenAIFunction[] = [
    {
      name: 'query_sentinel_data',
      description: 'Query Microsoft Sentinel security data using KQL (Kusto Query Language). Use this to search for security incidents, alerts, sign-in events, threats, devices, and other security-related data from Log Analytics workspace.',
      parameters: {
        type: 'object',
        properties: {
          kql_query: {
            type: 'string',
            description: `The KQL query to execute against Sentinel tables. 

CRITICAL: Always use proper table names and column names. Verify table exists before querying.

MULTI-SOURCE INCIDENT ARCHITECTURE:
IMPORTANT INCIDENT NAMING CONVENTION:
SecurityIncident table uses "Title" field (NOT "IncidentName") with this format:
- Format: "CVE [CVE-ID] on [application-name]"
- Example: "CVE CVE-2025-4598 on hr-portal" means CVE-2025-4598 found on hr-portal application
- To search for specific CVE: where Title contains "CVE-2025-4598"
- To search by application: where Title contains "hr-portal" (do NOT include "on " prefix)
- To find all CVEs on an app: where Title contains "[app-name]" then extract details

APPLICATION SEARCH EXAMPLES:
- For hr-portal: where Title contains "hr-portal"
- For api-gateway: where Title contains "api-gateway"  
- For payroll-system: where Title contains "payroll-system"
- The extract function handles parsing: extend AppName = extract(@"on (.+)$", 1, Title)

Example Valid Queries with CVE Context:
"SecurityIncident | where TimeGenerated >= ago(30d) | where Title contains 'hr-portal' | extend CVE_ID = extract(@'CVE-([\d-]+)', 1, Title), AppName = extract(@'on (.+)$', 1, Title) | where isnotempty(CVE_ID) | project TimeGenerated, Title, CVE_ID, Severity, Status | sort by TimeGenerated desc"
"SecurityIncident | where TimeGenerated >= ago(30d) | where Title contains 'CVE-2025-4598' | project TimeGenerated, Title, Severity, Status, Owner"
"SecurityIncident | where TimeGenerated >= ago(3d) | where Title contains 'payroll-system' | summarize IncidentCount=count() by Severity | sort by IncidentCount desc"

USER RISK ANALYSIS PATTERNS:
For user risk analysis queries, use AADUserRiskEvents table:

TOP RISKY USERS QUERY PATTERN:
"AADUserRiskEvents | where TimeGenerated > ago(30d) | summarize TotalRisks = count(), Reasons = make_set(RiskEventType) by UserPrincipalName, RiskLevel | top 3 by TotalRisks desc | extend RiskReason = strcat_array(Reasons, ', ') | project UserPrincipalName, RiskLevel, TotalRisks, RiskReason"

USER RISK BREAKDOWN BY TYPE:
"AADUserRiskEvents | where TimeGenerated > ago(30d) | summarize UserCount = dcount(UserPrincipalName), EventCount = count() by RiskEventType, RiskLevel | sort by EventCount desc"

SPECIFIC USER RISK ANALYSIS:
"AADUserRiskEvents | where TimeGenerated > ago(30d) | where UserPrincipalName == 'user@domain.com' | project TimeGenerated, RiskEventType, RiskLevel, RiskDetail | sort by TimeGenerated desc"

HIGH RISK USERS WITH RECENT ACTIVITY:
"AADUserRiskEvents | where TimeGenerated > ago(7d) | where RiskLevel in ('high', 'medium') | summarize LatestRisk = max(TimeGenerated), RiskTypes = make_set(RiskEventType) by UserPrincipalName, RiskLevel | sort by LatestRisk desc"

RISK EVENT TRENDS:
"AADUserRiskEvents | where TimeGenerated > ago(30d) | summarize EventCount = count() by bin(TimeGenerated, 1d), RiskLevel | render timechart"

Common Sentinel Tables with Key Columns:
- SecurityIncident: Title, IncidentNumber, Severity (High/Medium/Low/Informational), Status, Classification, Owner, ProviderName, RelatedAnalyticRuleIds, AlertIds, FirstActivityTime, LastActivityTime, TimeGenerated
- SecurityAlert: AlertName, AlertSeverity, AlertType, ProductName, Tactics, Techniques, Entities, CompromisedEntity, SystemAlertId, ExtendedProperties, TimeGenerated
- AADUserRiskEvents: UserPrincipalName, RiskLevel (High/Medium/Low), RiskEventType (anonymizedIPAddress, maliciousIPAddress, unfamiliarFeatures, malwareInfectedIPAddress, suspiciousIPAddress, leakedCredentials, investigationsThreatIntelligence, generic, adminConfirmedUserCompromised, mcasImpossibleTravel, mcasSuspiciousInboxManipulationRules, investigationsThreatIntelligenceSigninLinked, maliciousIPAddressValidCredentialsBlockedIP), RiskDetail, RiskState, Source, TimeGenerated, CorrelationId
- SigninLogs: UserPrincipalName, AppDisplayName, IPAddress, Location, ResultType (0=success), ResultDescription, ConditionalAccessStatus, RiskState, RiskLevelDuringSignIn, TimeGenerated
- AADNonInteractiveUserSignInLogs: UserPrincipalName, AppDisplayName, IPAddress, ResultType, ResourceDisplayName, TimeGenerated
- AADServicePrincipalSignInLogs: ServicePrincipalName, AppId, IPAddress, ResourceDisplayName, ResultType, TimeGenerated
- AADManagedIdentitySignInLogs: Identity, ResourceDisplayName, ResultType, TimeGenerated
- AuditLogs: OperationName, Result, InitiatedBy, TargetResources, Category, TimeGenerated
- BehaviorAnalytics: UserPrincipalName, RiskLevel (High/Medium/Low), RiskScore (0-10), RiskReason, ActivityType, ActionType, ActivityInsights, UsersInsights, TimeGenerated
- IdentityInfo: AccountUPN, Department, JobTitle, Manager, IsAccountEnabled, Tags, AssignedRoles, GroupMembership, TimeGenerated
- DeviceNetworkEvents: DeviceName, RemoteIP, RemotePort, RemoteUrl, InitiatingProcessAccountName, ActionType, TimeGenerated (Requires Defender for Endpoint)
- DeviceProcessEvents: DeviceName, FileName, FolderPath, ProcessCommandLine, AccountName, SHA256, InitiatingProcessFileName, TimeGenerated (Requires Defender for Endpoint)
- DeviceFileEvents: DeviceName, FileName, FolderPath, FileSize, ActionType (FileCreated/FileModified/FileDeleted), InitiatingProcessAccountName, SHA256, TimeGenerated (Requires Defender for Endpoint)
- ThreatIntelligenceIndicator: IndicatorType, ThreatType, Confidence (0-100), ThreatSeverity, Description, ExpirationDateTime, TimeGenerated
- OfficeActivity: UserId, Operation, RecordType, ResultStatus, ClientIP, OfficeWorkload, TimeGenerated
- AzureActivity: Caller, OperationName, ActivityStatusValue, ResourceGroup, ResourceProvider, SubscriptionId, Level, TimeGenerated
- CommonSecurityLog: DeviceVendor, DeviceProduct, Activity, SourceIP, DestinationIP, LogSeverity, TimeGenerated
- Syslog: Computer, Facility, SeverityLevel, SyslogMessage, ProcessName, HostIP, TimeGenerated
- SecurityEvent: Computer, EventID, Account, Activity, IpAddress, LogonType, ProcessName, CommandLine, TimeGenerated
- Heartbeat: Computer, OSType, Version, ComputerIP, Category, ComputerEnvironment, TimeGenerated
- Watchlist: SearchKey, WatchlistAlias, WatchlistItem, TimeGenerated

KQL Syntax Rules:
- Time filters: TimeGenerated >= ago(1d), TimeGenerated between(datetime(2024-01-01) .. datetime(2024-01-31))
- Limit results: take 100, top 10 by Column desc
- Aggregations: count(), dcount(), sum(), avg(), percentile(Column, 95), make_set(), strcat_array()
- Filtering: where Column == "value", where Column contains "text", where Column in ("val1", "val2"), where Column !contains "exclude"
- Sorting: order by Column desc, sort by Column asc
- Grouping: summarize count() by Column, summarize Total=count(), UniqueUsers=dcount(UserPrincipalName) by AppDisplayName
- Joins: join kind=inner (TableName) on $left.Key == $right.Key
- Project: project Column1, Column2, NewName = Column3
- String operations: tostring(), tolower(), toupper(), extract(), parse, split(), mv-expand, strcat_array()
- Date operations: ago(), now(), startofday(), endofday(), datetime_add(), datetime_diff()
- JSON parsing: parse_json(), bag_unpack(), extend field = parse_json(column)

Example Valid Queries for User Risk Analysis:

TOP 3 RISKY USERS:
"AADUserRiskEvents | where TimeGenerated > ago(30d) | summarize TotalRisks = count(), Reasons = make_set(RiskEventType) by UserPrincipalName, RiskLevel | top 3 by TotalRisks desc | extend RiskReason = strcat_array(Reasons, ', ') | project UserPrincipalName, RiskLevel, TotalRisks, RiskReason"

RISK EVENT BREAKDOWN:
"AADUserRiskEvents | where TimeGenerated > ago(30d) | summarize UserCount = dcount(UserPrincipalName), EventCount = count() by RiskEventType | sort by EventCount desc"

HIGH-RISK USER TIMELINE:
"AADUserRiskEvents | where TimeGenerated > ago(7d) | where RiskLevel == 'high' | project TimeGenerated, UserPrincipalName, RiskEventType, RiskDetail | sort by TimeGenerated desc | take 20"

USER RISK WITH SIGN-IN CORRELATION:
"AADUserRiskEvents | where TimeGenerated > ago(30d) | where RiskLevel in ('high', 'medium') | join kind=inner (SigninLogs | where TimeGenerated > ago(30d) | where RiskLevelDuringSignIn in ('high', 'medium')) on UserPrincipalName | project UserPrincipalName, RiskEventType, RiskLevel, IPAddress, Location, AppDisplayName | take 50"

PERFORMANCE BEST PRACTICES:
- ALWAYS include TimeGenerated filter for optimal performance
- ALWAYS limit results to prevent rate limiting: use "take 20" or "top 20" for general queries
- For broad queries (all incidents, all high severity, etc.) MANDATORY limit to top 20 records
- Use summarize for aggregations instead of returning raw data when possible
- Filter early in the query pipeline (use "where" before "project" or "summarize")
- When analyzing user risk, combine AADUserRiskEvents with SigninLogs for complete context
- Use make_set() and strcat_array() for aggregating risk reasons

CRITICAL RATE LIMITING PROTECTION:
- ALL queries without specific filtering MUST include "| take 20" or "| top 20 by Column"
- Broad queries like "show all incidents", "find high severity alerts" require automatic limiting
- Aggregation queries (summarize) can have higher limits but prefer <= 100 rows
- Time-based queries should default to last 7 days with "| take 20"

ALWAYS include TimeGenerated filter and result limits to prevent OpenAI rate limiting!`
          },
          timespan: {
            type: 'string',
            description: 'Time range for the query in ISO 8601 duration format. Examples: "P1D" (last 1 day), "P7D" (last 7 days), "PT1H" (last 1 hour), "P30D" (last 30 days). Default is P1D if not specified.',
            default: 'P1D'
          }
        },
        required: ['kql_query']
      }
    }
  ];

  /**
   * Enhanced system prompt for SentriBot security analysis with user risk focus
   */
  private readonly systemPrompt = `You are SentriBot, an elite AI security analyst for Microsoft Sentinel with deep expertise in:
- KQL (Kusto Query Language)
- User risk analysis and identity threat detection
- Multi-source incident correlation (Qualys, Microsoft XDR, etc.)
- CVE vulnerability analysis and tracking across sources
- Threat detection and incident response
- User behavior analytics (UEBA)
- Network security analysis
- Identity and access management
- Risk assessment and scoring

Your mission: Help security teams identify threats, track CVE vulnerabilities across applications and sources, analyze user risks, and investigate incidents using Microsoft Sentinel data from multiple integrated sources.

CRITICAL USER RISK ANALYSIS:
For user risk queries, leverage the AADUserRiskEvents table which contains:

🔹 RISK LEVELS:
- High: Immediate attention required, likely compromised
- Medium: Suspicious activity, investigation recommended  
- Low: Minor anomalies, monitoring advised

🔹 COMMON RISK EVENT TYPES:
- anonymizedIPAddress: User signing in from anonymized IP (Tor, VPN)
- maliciousIPAddress: Sign-in from known malicious IP address
- unfamiliarFeatures: Unusual sign-in properties for the user
- malwareInfectedIPAddress: Sign-in from malware-infected IP
- suspiciousIPAddress: Sign-in from suspicious IP address
- leakedCredentials: User credentials found in leaked credential lists
- investigationsThreatIntelligence: Flagged by threat intelligence
- mcasImpossibleTravel: Impossible travel between geographic locations  
- mcasSuspiciousInboxManipulationRules: Suspicious inbox rules detected
- adminConfirmedUserCompromised: Admin manually confirmed user compromise

🔹 USER RISK QUERY PATTERNS:

FOR "TOP RISKY USERS" QUERIES:
Use this proven pattern: AADUserRiskEvents | where TimeGenerated > ago(30d) | summarize TotalRisks = count(), Reasons = make_set(RiskEventType) by UserPrincipalName, RiskLevel | top 3 by TotalRisks desc | extend RiskReason = strcat_array(Reasons, ', ') | project UserPrincipalName, RiskLevel, TotalRisks, RiskReason

FOR RISK EVENT ANALYSIS:
Combine risk events with sign-in logs for complete context and correlation

FOR TIMELINE ANALYSIS:
Show chronological risk events to understand attack progression

MULTI-SOURCE ARCHITECTURE CONTEXT:
This Sentinel workspace integrates incidents from multiple security sources with specific identification patterns:

🔹 QUALYS INCIDENTS:
- Identifier: RelatedAnalyticRuleIds contains '7ec37e0e-5f7e-462d-8f5c-8225ad0fbdaa'
- Source field: Usually "Qualys" in ExtendedProperties Custom Details
- CVE data: ExtendedProperties.["Custom Details"].CVE (array)
- App data: ExtendedProperties.["Custom Details"].AppName (array)

🔹 MICROSOFT XDR INCIDENTS:
- Identifier: RelatedAnalyticRuleIds contains '6d1f212d-4e30-4d67-916d-584475ed2ed4'
- Source field: ProviderName (typically "Microsoft 365 Defender")
- CVE data: ExtendedProperties custom fields (JSON parsed)
- Integration: Native Microsoft Defender integration

WHEN USER ASKS ABOUT USER RISK:
1. "Find top risky users" → Use AADUserRiskEvents with TotalRisks summarization
2. "Why is user at risk" → Show RiskEventType breakdown and timeline
3. "User risk trends" → Analyze risk events over time with trends
4. "High-risk user activity" → Correlate risk events with sign-in logs

CRITICAL QUERY REQUIREMENTS:
1. ALWAYS verify table names exist in Sentinel (exact casing)
2. ALWAYS include TimeGenerated filter (e.g., TimeGenerated >= ago(7d))
3. ALWAYS use exact column names (case-sensitive)
4. For user risk analysis, use AADUserRiskEvents as primary table
5. ALWAYS limit results (use "take 100" or "top 10 by Column" for summaries)
6. Use make_set() and strcat_array() for aggregating risk reasons
7. Combine with SigninLogs for complete user activity context

RESPONSE FORMAT FOR USER RISK QUERIES:
When presenting user risk results, always provide:

📊 EXECUTIVE SUMMARY
Overview of user risk landscape with specific user counts and risk levels

🔍 TOP RISK USERS
• User details with risk levels and event counts
• Specific risk event types for each user
• Timeline of recent risk activity

⚠️ RISK ASSESSMENT
• Explain security significance of each risk event type
• Assess likelihood of compromise for each user
• Reference attack patterns and TTPs where applicable
• Prioritize users by risk severity and urgency

💡 IMMEDIATE ACTIONS
• User-specific recommendations (password reset, MFA, disable account)
• Investigation steps (review sign-in logs, check for data access)
• Preventive measures (conditional access policies, risk-based policies)
• Monitoring recommendations for ongoing assessment

📋 TECHNICAL DETAILS
• Show risk event data with timestamps and details
• Include correlation with sign-in activities where relevant  
• Display the KQL query used for transparency
• Explain data limitations and time ranges

🎯 RISK EVENT CONTEXT
For each risk event type, explain:
• What it indicates about user behavior
• Potential attack scenarios it could represent
• Urgency level for investigation and response
• Common follow-up actions security teams should take

Always explain the SECURITY SIGNIFICANCE and provide actionable intelligence.
When analyzing user risk, consider the full context including sign-in patterns, location changes, and behavioral anomalies.
Prioritize recommendations based on risk level and potential business impact.`;

  constructor(
    private openAIService: OpenAIService,
    private logAnalyticsService: LogAnalyticsService
  ) {}

  /**
   * Validate KQL query for common issues and best practices
   */
  private validateKqlQuery(query: string): { valid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];

    // Check for empty query
    if (!query || query.trim().length === 0) {
      return { valid: false, error: 'Query cannot be empty' };
    }

    // Check for time filter (best practice)
    const hasTimeFilter = /TimeGenerated\s*(>=|>|between)/i.test(query) || /ago\(/i.test(query);
    if (!hasTimeFilter) {
      warnings.push('Query missing TimeGenerated filter - performance may be impacted');
    }

    // Check for result limiting
    const hasLimit = /(take|top|limit)\s+\d+/i.test(query);
    const hasSummarize = /summarize/i.test(query);
    if (!hasLimit && !hasSummarize) {
      warnings.push('Query may return large result set - consider adding "take" or "top"');
    }

    // Check for excessively large limits
    const limitMatch = query.match(/(take|top|limit)\s+(\d+)/i);
    if (limitMatch && parseInt(limitMatch[2]) > 10000) {
      warnings.push('Large result limit detected - consider reducing for better performance');
    }

    // Check for dangerous operations
    const dangerousPatterns = [
      { pattern: /\.drop\s*\(/i, message: 'Drop operations are not allowed' },
      { pattern: /\.delete\s*\(/i, message: 'Delete operations are not allowed' },
      { pattern: /drop\s+table/i, message: 'Drop table operations are not allowed' }
    ];
    
    for (const dangerous of dangerousPatterns) {
      if (dangerous.pattern.test(query)) {
        return { valid: false, error: dangerous.message };
      }
    }

    // Check for common table name mistakes
    const commonMistakes = [
      { wrong: /\bIncidents\b/i, correct: 'SecurityIncident', message: 'Use "SecurityIncident" not "Incidents"' },
      { wrong: /\bAlerts\b/i, correct: 'SecurityAlert', message: 'Use "SecurityAlert" not "Alerts"' },
      { wrong: /\bSignInLogs\b/i, correct: 'SigninLogs', message: 'Use "SigninLogs" (lowercase i)' },
      { wrong: /\bIncidentName\b/i, correct: 'Title', message: 'Use "Title" not "IncidentName" for SecurityIncident' },
      { wrong: /\bUserRiskEvents\b/i, correct: 'AADUserRiskEvents', message: 'Use "AADUserRiskEvents" not "UserRiskEvents"' }
    ];

    for (const mistake of commonMistakes) {
      if (mistake.wrong.test(query)) {
        warnings.push(mistake.message);
      }
    }

    // Check for proper ExtendedProperties parsing
    if (query.includes('ExtendedProperties') && !query.includes('parse_json')) {
      warnings.push('ExtendedProperties typically requires parse_json() for proper parsing');
    }

    // Check for source-specific rule IDs
    const hasQualysRuleId = query.includes('7ec37e0e-5f7e-462d-8f5c-8225ad0fbdaa');
    const hasXDRRuleId = query.includes('6d1f212d-4e30-4d67-916d-584475ed2ed4');
    if (hasQualysRuleId || hasXDRRuleId) {
      warnings.push('Source-specific query detected - ensure proper RelatedAnalyticRuleIds usage');
    }

    // Check for user risk analysis patterns
    if (query.includes('AADUserRiskEvents') && !query.includes('make_set')) {
      warnings.push('Consider using make_set() to aggregate risk event types for better analysis');
    }

    // Log warnings if any
    if (warnings.length > 0) {
      console.warn('⚠️ Query validation warnings:', warnings);
    }

    return { valid: true, warnings };
  }

  /**
   * Query Sentinel using natural language via SentriBot
   * This is the main entry point for the SentriBot component
   */
  querySentinel(userQuery: string): Observable<SentinelQueryResult> {
    console.log('🤖 SentriBot processing multi-source query:', userQuery);

    const messages: OpenAIMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: userQuery }
    ];

    // Step 1: Ask OpenAI to generate a KQL query
    return this.openAIService.chatCompletion(messages, this.sentinelFunctions, 'auto').pipe(
      switchMap(response => {
        const message = response.choices[0].message;

        // Check if OpenAI wants to call the query function
        if (message.function_call && message.function_call.name === 'query_sentinel_data') {
          const args = JSON.parse(message.function_call.arguments);
          const kqlQuery = args.kql_query;
          const timespan = args.timespan || 'P1D';

          console.log('📝 Generated KQL for multi-source query:', kqlQuery);
          console.log('⏱️ Timespan:', timespan);

          // Validate query before execution
          const validation = this.validateKqlQuery(kqlQuery);
          if (!validation.valid) {
            console.error('❌ Query validation failed:', validation.error);
            return of({
              query: userQuery,
              kqlQuery: kqlQuery,
              result: `❌ Invalid query: ${validation.error}\n\n**Generated Query:**\n\`\`\`kql\n${kqlQuery}\n\`\`\`\n\nPlease try rephrasing your question or ask me to generate a corrected query.`,
              timestamp: new Date(),
              isError: true
            } as SentinelQueryResult);
          }

          // Log warnings if present
          if (validation.warnings && validation.warnings.length > 0) {
            console.warn('⚠️ Query warnings:', validation.warnings.join('; '));
          }

          // Step 2: Execute the KQL query against Log Analytics
          return this.logAnalyticsService.executeQuery(kqlQuery, timespan).pipe(
            switchMap(queryResult => {
              // Step 3: Send results back to OpenAI for analysis
              const functionResultMessage: OpenAIMessage = {
                role: 'function',
                name: 'query_sentinel_data',
                content: JSON.stringify({
                  success: queryResult.success,
                  rowCount: queryResult.rowCount || 0,
                  data: queryResult.data,
                  query: kqlQuery,
                  warnings: validation.warnings,
                  multiSource: kqlQuery.includes('RelatedAnalyticRuleIds') || kqlQuery.includes('union'),
                  sources: this.detectQuerySources(kqlQuery),
                  userRiskAnalysis: kqlQuery.includes('AADUserRiskEvents')
                })
              };

              const updatedMessages: OpenAIMessage[] = [
                ...messages,
                message,
                functionResultMessage
              ];

              // Step 4: Get OpenAI's analysis of the results
              return this.openAIService.chatCompletion(updatedMessages).pipe(
                map(finalResponse => ({
                  query: userQuery,
                  kqlQuery: kqlQuery,
                  result: finalResponse.choices[0].message.content || 'No analysis provided',
                  data: queryResult.data,
                  timestamp: new Date(),
                  isError: false
                } as SentinelQueryResult))
              );
            }),
            catchError(error => {
              console.error('❌ Multi-source query execution failed:', error);
              
              // Provide helpful error messages based on error type
              let errorMessage = `❌ **Error executing query**\n\n`;
              
              if (error.status === 403) {
                errorMessage += `**Permission Denied**\nYou don't have permission to query this workspace.\n\n`;
                errorMessage += `**Required Permissions:**\n`;
                errorMessage += `• Log Analytics Reader role\n`;
                errorMessage += `• Microsoft Sentinel Reader role\n\n`;
              } else if (error.status === 404) {
                errorMessage += `**Workspace Not Found**\nThe Log Analytics workspace could not be found.\n\n`;
              } else if (error.error?.error?.message) {
                errorMessage += `**Details:** ${error.error.error.message}\n\n`;
                
                // Check for common KQL errors
                if (error.error.error.message.includes("AADUserRiskEvents")) {
                  errorMessage += `**Hint:** Ensure AADUserRiskEvents table exists in your workspace\n`;
                  errorMessage += `This table requires Azure AD Identity Protection licensing\n`;
                } else if (error.error.error.message.includes("ExtendedProperties")) {
                  errorMessage += `**Hint:** ExtendedProperties parsing requires proper JSON handling\n`;
                  errorMessage += `Use: parse_json(ExtendedProperties) then parse_json(tostring(result.["Custom Details"]))\n`;
                } else if (error.error.error.message.includes("make_set")) {
                  errorMessage += `**Hint:** make_set() requires summarize operation context\n`;
                } else if (error.error.error.message.includes("strcat_array")) {
                  errorMessage += `**Hint:** strcat_array() is used to join array elements into a string\n`;
                }
              } else {
                errorMessage += `**Details:** ${error.message || 'Unknown error'}\n\n`;
              }
              
              errorMessage += `\n**Generated Query:**\n\`\`\`kql\n${kqlQuery}\n\`\`\`\n\n`;
              errorMessage += `**Troubleshooting:**\n`;
              errorMessage += `• Verify your Log Analytics workspace ID is correct\n`;
              errorMessage += `• Check that you have permission to query the workspace\n`;
              errorMessage += `• Ensure AADUserRiskEvents table is available (requires Azure AD P2 licensing)\n`;
              errorMessage += `• Validate the KQL syntax is correct\n`;
              errorMessage += `• For user risk queries, ensure proper aggregation with make_set()\n`;

              return of({
                query: userQuery,
                kqlQuery: kqlQuery,
                result: errorMessage,
                timestamp: new Date(),
                isError: true
              } as SentinelQueryResult);
            })
          );
        } else {
          // OpenAI responded without calling a function (maybe clarifying question)
          return of({
            query: userQuery,
            result: message.content || '🤖 I need more information to query Sentinel. Could you please be more specific about what security data you want to see?\n\n**Multi-Source Examples:**\n• Show me Qualys incidents\n• Find Microsoft XDR alerts\n• Compare incidents across sources\n• Show CVE-2024-1234 from all sources\n\n**User Risk Examples:**\n• Find the top three users that are at risk\n• Show high-risk users in the last 7 days\n• Analyze user risk events by type\n• Why is john.doe@company.com at risk?',
            timestamp: new Date(),
            isError: false
          } as SentinelQueryResult);
        }
      }),
      catchError(error => {
        console.error('❌ OpenAI error in multi-source processing:', error);
        return of({
          query: userQuery,
          result: `❌ **Error communicating with AI:** ${error.message}\n\nPlease check your Azure OpenAI configuration and try again.`,
          timestamp: new Date(),
          isError: true
        } as SentinelQueryResult);
      })
    );
  }

  /**
   * Detect which sources are being queried based on the KQL
   */
  private detectQuerySources(kqlQuery: string): string[] {
    const sources: string[] = [];
    
    if (kqlQuery.includes('7ec37e0e-5f7e-462d-8f5c-8225ad0fbdaa')) {
      sources.push('Qualys');
    }
    
    if (kqlQuery.includes('6d1f212d-4e30-4d67-916d-584475ed2ed4')) {
      sources.push('Microsoft XDR');
    }
    
    if (kqlQuery.includes('AADUserRiskEvents')) {
      sources.push('Azure AD Identity Protection');
    }
    
    if (kqlQuery.includes('ProviderName')) {
      sources.push('General Provider Query');
    }
    
    if (sources.length === 0) {
      sources.push('All Sources');
    }
    
    return sources;
  }
}