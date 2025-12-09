# Architecture Decision Record: Use Azure OpenAI for Natural Language Processing

## Status
Accepted

## Context
The Security Control Tower application requires AI-powered capabilities to enable security analysts to query security data using natural language instead of writing complex KQL queries. The system needs to:

- Convert natural language questions into valid KQL queries
- Understand security domain context and terminology
- Provide intelligent analysis and recommendations
- Support function calling to execute queries
- Handle multi-turn conversations
- Provide consistent and accurate query generation

The security analyst experience should be:
- "Find the top three users that are at risk" → Automatic KQL generation and execution
- "Show me CVE-2024-1234 incidents" → Intelligent query with proper filtering
- "Why is john.doe@company.com at risk?" → Contextual analysis with recommendations

## Decision
We will use **Azure OpenAI Service with GPT-4o model** to power the SentriBot natural language query interface.

## Rationale

### Azure OpenAI Advantages
1. **Enterprise-Grade Security**: Data remains within Azure tenant boundaries
2. **Compliance**: Meets enterprise compliance requirements (SOC 2, ISO 27001, etc.)
3. **No Data Training**: Customer data not used to train models
4. **Private Endpoint Support**: Can be accessed via Azure Private Link
5. **Azure Integration**: Seamless integration with other Azure services
6. **SLA Guarantees**: Enterprise SLA with Microsoft support

### GPT-4o Model Benefits
1. **Function Calling**: Native support for tool/function calling to execute queries
2. **Large Context Window**: Handles long system prompts with security domain knowledge
3. **JSON Mode**: Structured output for reliable parsing
4. **High Accuracy**: Superior query generation compared to earlier models
5. **Reasoning Capabilities**: Can analyze security data and provide insights
6. **Multimodal**: Future support for analyzing security diagrams and screenshots

### Security Domain Suitability
1. **Domain Knowledge**: Can be prompted with security-specific terminology
2. **KQL Generation**: Excellent at translating natural language to query languages
3. **Table Schema Understanding**: Can work with complex data models
4. **Contextual Awareness**: Understands security concepts like CVEs, risk levels, incidents
5. **Multi-Source Correlation**: Can reason about data from different security tools

### Alternative Solutions Considered

**OpenAI Public API**
- Pros: Latest models, high performance
- Cons: Data leaves enterprise boundaries, no compliance guarantees, public internet dependency
- Decision: Rejected due to security and compliance concerns

**Self-Hosted Models (LLaMA, Mistral)**
- Pros: Full control, no external dependencies
- Cons: Requires GPU infrastructure, maintenance burden, lower accuracy
- Decision: Rejected due to operational complexity and lower accuracy

**Azure Cognitive Services (Pre-GPT)**
- Pros: Azure integration, simpler APIs
- Cons: Limited natural language understanding, no function calling
- Decision: Rejected as insufficient for complex query generation

**Anthropic Claude (via Azure)**
- Pros: Good reasoning capabilities
- Cons: Not available in Azure OpenAI Service, less tested for KQL generation
- Decision: Rejected due to limited Azure availability

## Consequences

### Positive
- **Natural Language Interface**: Security analysts can ask questions in plain English
- **Reduced Training**: Less KQL knowledge required for basic queries
- **Intelligent Analysis**: AI provides context and recommendations
- **Consistent Results**: Reproducible query generation with system prompts
- **Scalable**: Handles increasing complexity without code changes
- **Enterprise Security**: Data remains in Azure tenant
- **Function Calling**: Reliable tool execution with structured parameters

### Negative
- **API Costs**: Per-token pricing for API calls
- **Latency**: Additional API roundtrip adds ~2-3 seconds to queries
- **Rate Limits**: Need to handle API rate limiting
- **API Key Management**: Requires secure API key storage
- **Model Updates**: Model behavior may change with updates
- **Dependency**: Relies on Azure OpenAI service availability

### Neutral
- **Prompt Engineering**: Requires expertise in crafting effective system prompts
- **Monitoring**: Need to monitor API usage and costs
- **Validation**: Generated queries must be validated before execution

## Implementation Details

### System Prompt Engineering

The system prompt is critical for reliable query generation:

```typescript
const systemPrompt = `You are SentriBot, an elite AI security analyst for Microsoft Sentinel with deep expertise in:
- KQL (Kusto Query Language)
- User risk analysis and identity threat detection
- Multi-source incident correlation (Qualys, Microsoft XDR, etc.)
- CVE vulnerability analysis and tracking across sources

Your mission: Help security teams identify threats, track CVE vulnerabilities, 
analyze user risks, and investigate incidents using Microsoft Sentinel data.

CRITICAL QUERY REQUIREMENTS:
1. ALWAYS verify table names exist in Sentinel (exact casing)
2. ALWAYS include TimeGenerated filter (e.g., TimeGenerated >= ago(7d))
3. ALWAYS use exact column names (case-sensitive)
4. ALWAYS limit results (use "take 20" or "top 10")

Available Tables:
- SecurityIncident: Title, Severity, Status, ProviderName
- AADUserRiskEvents: UserPrincipalName, RiskLevel, RiskEventType
- SigninLogs: UserPrincipalName, IPAddress, ResultType
...
`;
```

### Function Calling Pattern

```typescript
const sentinelFunctions: OpenAIFunction[] = [
  {
    name: 'query_sentinel_data',
    description: 'Query Microsoft Sentinel security data using KQL',
    parameters: {
      type: 'object',
      properties: {
        kql_query: {
          type: 'string',
          description: 'The KQL query to execute. Must include TimeGenerated filter and result limiting.'
        },
        timespan: {
          type: 'string',
          description: 'Time range in ISO 8601 duration format (P1D, P7D, PT1H)',
          default: 'P1D'
        }
      },
      required: ['kql_query']
    }
  }
];
```

### Query Processing Flow

```typescript
// 1. Send user query to OpenAI with functions
const response = await openAIService.chatCompletion(messages, sentinelFunctions, 'auto');

// 2. OpenAI decides to call function
if (response.choices[0].message.function_call) {
  const args = JSON.parse(response.choices[0].message.function_call.arguments);
  const kqlQuery = args.kql_query;
  
  // 3. Execute KQL query
  const queryResult = await logAnalyticsService.executeQuery(kqlQuery);
  
  // 4. Send results back to OpenAI for analysis
  const analysisResponse = await openAIService.chatCompletion([
    ...messages,
    response.choices[0].message,
    { role: 'function', name: 'query_sentinel_data', content: JSON.stringify(queryResult) }
  ]);
  
  // 5. Return formatted response
  return analysisResponse.choices[0].message.content;
}
```

### Query Validation

```typescript
private validateKqlQuery(query: string): QueryValidation {
  // Check for required elements
  const hasTimeFilter = /TimeGenerated\s*(>=|>|between)/i.test(query);
  const hasLimit = /(take|top|limit)\s+\d+/i.test(query);
  
  // Check for dangerous operations
  const dangerousPatterns = [
    { pattern: /\.drop\s*\(/i, message: 'Drop operations are not allowed' },
    { pattern: /\.delete\s*\(/i, message: 'Delete operations are not allowed' }
  ];
  
  // Check for common table name mistakes
  const commonMistakes = [
    { wrong: /\bIncidents\b/i, correct: 'SecurityIncident' },
    { wrong: /\bIncidentName\b/i, correct: 'Title' }
  ];
  
  return { valid: true, warnings };
}
```

## Cost Management

### Pricing Considerations
- **Input Tokens**: System prompt + user query + function definitions (~1500 tokens)
- **Output Tokens**: Generated KQL + analysis (~500-1000 tokens)
- **Estimated Cost per Query**: $0.02-0.05 USD (GPT-4o pricing)
- **Monthly Estimate**: 1000 queries/month = $20-50 USD

### Cost Optimization Strategies
1. **Prompt Caching**: Reuse system prompt across requests (future OpenAI feature)
2. **Shorter Prompts**: Optimize system prompt length while maintaining accuracy
3. **Result Summarization**: Only send relevant data back to AI, not full result sets
4. **Rate Limiting**: Prevent abuse with per-user query limits
5. **Model Selection**: Use GPT-4o-mini for simpler queries (when available)

## Performance Considerations

### Latency
- **Average Response Time**: 2-3 seconds for query generation
- **Timeout Configuration**: 30 seconds for API calls
- **User Experience**: Show loading indicator during processing

### Rate Limiting
- **Azure OpenAI Limits**: Tokens per minute (TPM) and requests per minute (RPM)
- **Handling Strategy**: Exponential backoff with retry
- **User Feedback**: Clear error messages when rate limited

## Security Considerations

### API Key Management
```typescript
// Environment configuration
const openai = {
  apiKey: process.env.AZURE_OPENAI_API_KEY,  // Never hardcode
  apiUrl: process.env.AZURE_OPENAI_ENDPOINT,
  model: 'gpt-4o'
};
```

### Query Safety
1. **Validation**: All generated queries validated before execution
2. **Dangerous Operations**: Block drop, delete, and admin operations
3. **Result Limiting**: Enforce maximum result set size
4. **Workspace Isolation**: Queries scoped to specific workspace

### Data Privacy
1. **No Training**: Azure OpenAI doesn't use customer data for training
2. **Data Residency**: Data stays within Azure tenant
3. **Audit Logging**: All queries logged for compliance
4. **PII Handling**: Avoid sending PII in prompts when possible

## Monitoring and Observability

### Metrics to Track
```typescript
interface OpenAIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  totalTokensUsed: number;
  estimatedCost: number;
  rateLimitErrors: number;
}
```

### Logging
```typescript
console.log('🤖 OpenAI Request:', {
  userQuery: userQuery,
  model: 'gpt-4o',
  functions: functionsCount,
  timestamp: new Date()
});

console.log('✅ OpenAI Response:', {
  functionCalled: response.choices[0].message.function_call?.name,
  tokensUsed: response.usage.total_tokens,
  latency: responseTime,
  timestamp: new Date()
});
```

## Testing Strategy

### Unit Testing
```typescript
describe('OpenAIService', () => {
  it('should generate valid KQL for user risk query', async () => {
    const response = await service.chatCompletion(messages, functions);
    expect(response.choices[0].message.function_call?.name).toBe('query_sentinel_data');
  });
});
```

### Integration Testing
- Test actual API calls in staging environment
- Verify query generation accuracy
- Test function calling flow end-to-end

### Prompt Testing
- Maintain test cases for common queries
- Validate query correctness
- Test edge cases and error handling

## Future Enhancements

### Potential Improvements
1. **Streaming Responses**: Real-time response streaming for better UX
2. **Multi-Turn Conversations**: Maintain conversation context
3. **Query Optimization**: AI suggests query improvements
4. **Visual Analysis**: Analyze security dashboards and screenshots
5. **Automated Remediation**: AI suggests remediation steps
6. **Custom Function Library**: Expand available functions

### Model Updates
- Monitor for GPT-4o updates and improvements
- Test new models (GPT-5, etc.) when available
- Evaluate cost vs. performance trade-offs

## Related Decisions
- [ADR-001: Use Angular Framework for Frontend](#adr-001-use-angular-framework-for-frontend)
- [ADR-004: Use Azure Log Analytics for Security Data](#adr-004-use-azure-log-analytics-for-security-data)
- [ADR-007: Use MCP Protocol for Tool Integration](#adr-007-use-mcp-protocol-for-tool-integration)

## References
- [Azure OpenAI Service Documentation](https://learn.microsoft.com/azure/cognitive-services/openai/)
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [GPT-4o Model Documentation](https://platform.openai.com/docs/models/gpt-4o)

---

**Date**: 2024  
**Author**: SCT Development Team  
**Decision ID**: ADR-003
