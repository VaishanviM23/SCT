import { LogLevel } from "@azure/msal-browser";

const msalLogger = {
  config: {
    level: LogLevel.Warning,
    piiLoggingEnabled: false
  }
}

const msalConfigs = {
  graph: {
    url: 'https://graph.microsoft.com/v1.0',
    scopes: [
      "https://graph.microsoft.com/openid",
      "https://graph.microsoft.com/email",
      "https://graph.microsoft.com/profile",
      "https://graph.microsoft.com/User.Read"
    ]
  },
  pbiAuth: {
    url: 'https://api.powerbi.com',
    scopes: [
      "https://analysis.windows.net/powerbi/api/Content.Create",
      "https://analysis.windows.net/powerbi/api/Dataset.ReadWrite.All"
    ]
  },
  pbiClient: {
    url: "https://embedded.powerbi.com",
    scopes: [
      "https://analysis.windows.net/powerbi/api/Content.Create",
      "https://analysis.windows.net/powerbi/api/Dataset.ReadWrite.All"
    ]
  },
  authentication: {
    clientId: '1c795d2c-3f87-4939-8bb4-18e6b1dc6927',
    authority: 'https://login.microsoftonline.com/21c55ba6-87e6-4aae-b3cf-3d718dcc9b10',
    redirectUri: 'https://proud-sand-0791e2100.3.azurestaticapps.net/',
    postLogoutRedirectUri: 'https://proud-sand-0791e2100.3.azurestaticapps.net/',
  },
  // ADDED: Log Analytics workspace configuration
  logAnalytics: {
    workspaceId: '9cc3d684-d69f-4946-8fcf-125b25eebf69',
    url: 'https://api.loganalytics.io/v1/workspaces',
    scopes: ['https://api.loganalytics.io/.default']
  },
  // ADDED: OpenAI configuration for production
  openai: {
    apiKey: 'YOUR_AZURE_OPENAI_API_KEY',
    apiUrl: 'https://nikhi-mi4irro2-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview',
    model: 'gpt-4o'
  }
}

export const environment = {
  production: true,
  connectorsUri: 'https://proud-sand-0791e2100.3.azurestaticapps.net/',
  graphUrl: 'https://graph.microsoft.com/v1.0',
  cloudfareIps: ["8.29.109.216", "8.29.109.217", "8.29.228.191", "8.29.231.52"],
  msalLogger,
  msalConfigs // ADDED: This was missing in your production config
};