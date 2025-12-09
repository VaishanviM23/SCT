# Architecture Decision Record: Use MSAL for Authentication

## Status
Accepted

## Context
The Security Control Tower application requires secure authentication and authorization to access sensitive security data from Azure services including:
- Microsoft Sentinel / Log Analytics
- Azure OpenAI Service
- Power BI Embedded
- Microsoft Graph API

The application needs to:
- Authenticate users against Azure Active Directory
- Acquire access tokens for different Azure services with appropriate scopes
- Handle token refresh automatically
- Provide a seamless user experience
- Support both interactive and silent token acquisition
- Maintain secure token storage

## Decision
We will use **Microsoft Authentication Library (MSAL) for Angular** to handle all authentication and authorization flows in the application.

## Rationale

### MSAL Benefits
1. **Official Microsoft Library**: First-party support for Azure AD authentication
2. **OAuth 2.0 / OpenID Connect**: Industry-standard authentication protocols
3. **Automatic Token Management**: Handles token caching, refresh, and expiration
4. **Multiple Flow Support**: 
   - Authorization Code Flow with PKCE (most secure for SPAs)
   - Silent token acquisition
   - Interactive fallback when needed
5. **Angular Integration**: `@azure/msal-angular` package provides:
   - MsalGuard for route protection
   - MsalInterceptor for automatic token injection
   - MsalService for programmatic access

### Security Advantages
1. **Token Storage**: Secure token storage in browser localStorage with automatic cleanup
2. **PKCE Support**: Proof Key for Code Exchange prevents authorization code interception
3. **Scope-Based Access**: Granular permission control per API
4. **Silent Refresh**: Background token refresh without user interruption
5. **SSO Support**: Single sign-on across multiple Azure applications

### Azure Integration
1. **Multi-Service Support**: Single authentication for multiple Azure services
2. **Conditional Access**: Supports Azure AD Conditional Access policies
3. **MFA Compatible**: Works seamlessly with multi-factor authentication
4. **B2C Support**: Compatible with Azure AD B2C for external users
5. **Token Scopes**: Easy configuration of service-specific scopes:
   ```typescript
   protectedResourceMap.set(
     'https://api.loganalytics.io/v1',
     ['https://api.loganalytics.io/.default']
   );
   ```

### Alternative Authentication Methods Considered

**Custom OAuth Implementation**
- Pros: Full control over implementation
- Cons: High security risk, maintenance burden, no automatic token refresh
- Decision: Rejected due to security concerns and complexity

**Auth0 or Okta**
- Pros: Feature-rich, cross-platform support
- Cons: Additional cost, unnecessary for Azure-only integration, adds external dependency
- Decision: Rejected as MSAL is more appropriate for Azure-centric application

**Azure AD Library (ADAL)**
- Pros: Previous Microsoft authentication library
- Cons: Deprecated, no longer maintained, doesn't support PKCE
- Decision: Rejected as MSAL is the modern replacement

## Consequences

### Positive
- **Zero Implementation of Auth Logic**: MSAL handles all OAuth flows
- **Automatic Token Refresh**: Tokens refreshed silently before expiration
- **Route Protection**: MsalGuard automatically protects routes
- **Token Injection**: MsalInterceptor adds tokens to HTTP requests automatically
- **Error Handling**: Built-in error handling for auth failures
- **TypeScript Support**: Full TypeScript definitions and type safety

### Negative
- **Library Dependency**: Application tightly coupled to MSAL library
- **Learning Curve**: Developers need to understand MSAL configuration and patterns
- **Azure AD Dependency**: Requires Azure AD tenant configuration
- **Browser Storage**: Tokens stored in localStorage (acceptable for web apps)
- **Version Updates**: Need to keep MSAL library updated for security patches

### Neutral
- **Azure-Specific**: Works only with Azure AD (not an issue for this application)
- **Configuration Complexity**: Initial setup requires understanding of OAuth flows and Azure AD

## Implementation Details

### MSAL Configuration
```typescript
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
        logLevel: LogLevel.Verbose,
        piiLoggingEnabled: false
      }
    }
  });
}
```

### Protected Resource Mapping
```typescript
const protectedResourceMap = new Map<string, Array<string>>();

// Log Analytics
protectedResourceMap.set(
  'https://api.loganalytics.io/v1',
  ['https://api.loganalytics.io/.default']
);

// Azure Management
protectedResourceMap.set(
  'https://management.azure.com/',
  ['https://management.azure.com/user_impersonation']
);

// Microsoft Graph
protectedResourceMap.set(
  'https://graph.microsoft.com/v1.0',
  ['User.Read']
);
```

### Route Protection
```typescript
const routes: Routes = [
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [MsalGuard]  // Automatic authentication check
  }
];
```

### Token Acquisition
```typescript
// Silent token acquisition with interactive fallback
async getLogAnalyticsToken(): Promise<AuthenticationResult> {
  const account = this.msalService.instance.getAllAccounts()[0];
  
  try {
    return await this.msalService.instance.acquireTokenSilent({
      scopes: ['https://api.loganalytics.io/.default'],
      account: account
    });
  } catch (error) {
    // Fallback to interactive login
    return await this.msalService.instance.acquireTokenPopup({
      scopes: ['https://api.loganalytics.io/.default']
    });
  }
}
```

## Security Considerations

### Token Storage
- Tokens stored in browser localStorage (encrypted in transit)
- Tokens automatically cleared on logout
- Token cache managed by MSAL with automatic cleanup

### Token Scope Validation
- Each API call uses specific scopes
- Principle of least privilege applied
- Token audience validated by Azure AD

### Session Management
- Configurable token lifetime
- Automatic silent refresh before expiration
- Session timeout handled gracefully

## Performance Considerations

### Token Caching
- Tokens cached to avoid unnecessary authentication calls
- Cache invalidated on token expiration
- Shared cache across browser tabs (same origin)

### Silent Refresh
- Background token refresh prevents user interruption
- Refresh occurs before token expiration
- Fallback to interactive login only when necessary

## Testing Strategy

### Unit Testing
- Mock MsalService for component tests
- Test authentication guard behavior
- Verify token acquisition logic

### Integration Testing
- Test actual authentication flow in staging environment
- Verify token refresh mechanism
- Test multiple service token acquisition

## Monitoring and Logging

### MSAL Logger Configuration
```typescript
loggerOptions: {
  loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
    if (containsPii) return;  // Never log PII
    
    switch (level) {
      case LogLevel.Error:
        console.error(message);
        break;
      case LogLevel.Info:
        console.info(message);
        break;
      // ... other levels
    }
  },
  logLevel: LogLevel.Verbose,
  piiLoggingEnabled: false  // Critical: never enable in production
}
```

### Authentication Events
- Login success/failure logged
- Token acquisition tracked
- Refresh failures monitored

## Migration Path

### From ADAL (if applicable)
1. Install MSAL Angular package
2. Update configuration from ADAL to MSAL format
3. Replace ADAL guards with MsalGuard
4. Update token acquisition calls
5. Test authentication flows thoroughly

### Future Updates
- Follow MSAL release notes for breaking changes
- Test updates in staging environment
- Update TypeScript definitions if needed

## Related Decisions
- [ADR-001: Use Angular Framework for Frontend](#adr-001-use-angular-framework-for-frontend)
- [ADR-004: Use Azure Log Analytics for Security Data](#adr-004-use-azure-log-analytics-for-security-data)
- [ADR-005: Use Power BI Embedded for Dashboards](#adr-005-use-power-bi-embedded-for-dashboards)

## References
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [MSAL Angular Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular)
- [Azure AD OAuth 2.0](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow)

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-09  
**Author**: SCT Development Team
