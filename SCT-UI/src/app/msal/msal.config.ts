import { MsalGuardConfiguration, MsalInterceptorConfiguration, ProtectedResourceScopes, MsalService } from '@azure/msal-angular';
import { BrowserCacheLocation, Configuration, InteractionType, LogLevel, PublicClientApplication } from '@azure/msal-browser';
import { HttpRequest } from '@angular/common/http';

import { loggerCallback } from './msal-logger';
import { environment } from '../../environments/environment';

const { msalConfigs } = environment;
const { userAgent } = window.navigator;
const isIE = userAgent.indexOf('MSIE ') > -1 || userAgent.indexOf('Trident/') > -1;
const isProduction = environment.production;

const protectedResourceMap: Map<string, Array<string | ProtectedResourceScopes> | null> = new Map();
// protectedResourceMap.set(msalConfigs.backendApi.url, msalConfigs.backendApi.scopes);
protectedResourceMap.set(msalConfigs.graph.url, msalConfigs.graph.scopes);
protectedResourceMap.set(msalConfigs.pbiAuth.url, msalConfigs.pbiAuth.scopes);
protectedResourceMap.set(msalConfigs.pbiClient.url, msalConfigs.pbiClient.scopes);

export const MsalConfig: Configuration = {
    auth: {
        clientId: msalConfigs.authentication.clientId,
        authority: msalConfigs.authentication.authority,
        redirectUri: msalConfigs.authentication.redirectUri,
        postLogoutRedirectUri: msalConfigs.authentication.postLogoutRedirectUri,
        navigateToLoginRequestUrl: true
    },
    cache: {
        cacheLocation: BrowserCacheLocation.LocalStorage,
        storeAuthStateInCookie: isIE,
        secureCookies: true
    },
    system: {
        allowRedirectInIframe: true,
        loggerOptions: {
            loggerCallback,
            logLevel: isProduction ? LogLevel.Warning : LogLevel.Info,
            piiLoggingEnabled: false
        }
    }
};


export const MsalGuardConfig: MsalGuardConfiguration =    {
        interactionType: InteractionType.Redirect,
        authRequest: {
          scopes: [
            'https://analysis.windows.net/powerbi/api/.default',
            'openid',
            'profile',
            'email'
          ],
        },
      }



export const MsalInterceptorConfig: MsalInterceptorConfiguration = {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
    authRequest: (msalService: MsalService, req: HttpRequest<unknown>, originalAuthRequest) => ({
        ...originalAuthRequest,
        // scopes: [...msalConfigs.backendApi.scopes]
    })
};
