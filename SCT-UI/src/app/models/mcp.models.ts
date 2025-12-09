/**
 * MCP (Model Context Protocol) Models
 * Based on JSON-RPC 2.0 specification
 */

export interface McpRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: number | string;
}

export interface McpResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: McpError;
  id: number | string;
}

export interface McpError {
  code: number;
  message: string;
  data?: any;
}

export interface McpToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface McpContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

export interface McpToolResult {
  content: McpContent[];
  isError?: boolean;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface SentinelQueryRequest extends McpRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface SentinelQueryResponse extends McpResponse {
  result: McpToolResult;
}

export interface SentinelQueryResult {
  query: string;
  kqlQuery?: string;
  result: string;
  data?: any[];
  timestamp: Date;
  isError: boolean;
}

/**
 * Models for OpenAI and Log Analytics integration
 */

// ============================================================================
// OpenAI Models - For query orchestration and function calling
// ============================================================================

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | null;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  functions?: OpenAIFunction[];
  function_call?: 'auto' | 'none' | { name: string };
  temperature?: number;
  max_tokens?: number;
}

export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// Log Analytics Models - For KQL query execution
// ============================================================================

export interface LogAnalyticsQuery {
  query: string;
  timespan?: string;
}

export interface LogAnalyticsColumn {
  name: string;
  type: string;
}

export interface LogAnalyticsTable {
  name: string;
  columns: LogAnalyticsColumn[];
  rows: any[][];
}

export interface LogAnalyticsResponse {
  tables: LogAnalyticsTable[];
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  columns?: LogAnalyticsColumn[];
  error?: string;
  executedQuery: string;
  rowCount?: number;
}

// ============================================================================
// Sentinel Query Models - For end-user results
// ============================================================================

export interface SentinelQueryResult {
  query: string;
  kqlQuery?: string;
  result: string;
  data?: any[];
  timestamp: Date;
  isError: boolean;
}