import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private msalService: MsalService) { }

  getCurrentUser(): AccountInfo | null {
    const accounts = this.msalService.instance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  async getPowerBiAccessToken(): Promise<string> {
    const account = this.getCurrentUser()!;
    const result = await this.msalService.instance.acquireTokenSilent({
      scopes: ['https://analysis.windows.net/powerbi/api/.default'],
      account,
    });
    return result.accessToken;
  }

  /**
   * Get access token for Log Analytics API
   * This enables querying Sentinel/Log Analytics data
   */
  async getLogAnalyticsToken(): Promise<AuthenticationResult> {
    const account = this.msalService.instance.getAllAccounts()[0];
    
    if (!account) {
      throw new Error('No active account found. Please sign in first.');
    }

    const request = {
      scopes: environment.msalConfigs.logAnalytics.scopes,
      account: account
    };

    try {
      // Try silent token acquisition first
      return await this.msalService.instance.acquireTokenSilent(request);
    } catch (error) {
      console.warn('Silent token acquisition failed, falling back to interactive login', error);
      // Fall back to interactive login if silent acquisition fails
      return await this.msalService.instance.acquireTokenPopup(request);
    }
  }

  login() {
    this.msalService.loginRedirect();
  }

  logout() {
    this.msalService.logoutRedirect({ postLogoutRedirectUri: '/' });
  }
}