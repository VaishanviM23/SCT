import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// MSAL Imports
import { 
  MsalModule, 
  MsalGuard, 
  MsalInterceptor, 
  MsalRedirectComponent,
  MsalService,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG
} from '@azure/msal-angular';
import { IPublicClientApplication, PublicClientApplication, InteractionType, LogLevel } from '@azure/msal-browser';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

// App Components
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './screens/dashboard/dashboard.component';
import { SentribotComponent } from './screens/sentribot/sentribot.component';
import { MainComponent } from './layout/main/main.component';
import { HeaderComponent } from './layout/header/header.component'; // Add this import

// Pipes
import { MarkdownPipe } from './pipes/markdown.pipe';

// Services
import { AuthService } from './services/auth.service';
import { OpenAIService } from './services/openai.service';
import { LogAnalyticsService } from './services/log-analytics.service';
import { SentinelQueryService } from './services/sentinel-query.service';

// Environment
import { environment } from '../environments/environment';
import { OverviewComponent } from './screens/overview/overview.component';

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
        loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case LogLevel.Error:
              console.error(message);
              return;
            case LogLevel.Info:
              console.info(message);
              return;
            case LogLevel.Verbose:
              console.debug(message);
              return;
            case LogLevel.Warning:
              console.warn(message);
              return;
          }
        },
        logLevel: environment.msalLogger.config.level,
        piiLoggingEnabled: environment.msalLogger.config.piiLoggingEnabled
      }
    }
  });
}

export function MSALGuardConfigFactory() {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['User.Read']
    }
  };
}

export function MSALInterceptorConfigFactory() {
  const protectedResourceMap = new Map<string, Array<string>>();
  
  // Add Log Analytics API protection
  if (environment.msalConfigs.logAnalytics?.scopes) {
    protectedResourceMap.set(
      'https://api.loganalytics.io/v1',
      environment.msalConfigs.logAnalytics.scopes
    );
  }
  
  // Add Azure Management API protection
  protectedResourceMap.set(
    'https://management.azure.com/',
    ['https://management.azure.com/user_impersonation']
  );
  
  // Add Microsoft Graph API protection
  protectedResourceMap.set(
    'https://graph.microsoft.com/v1.0',
    environment.msalConfigs.graph.scopes
  );

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,      // Add HeaderComponent
    MainComponent,
    DashboardComponent,
    SentribotComponent,
    MarkdownPipe,
    OverviewComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    
    // MSAL Module
    MsalModule,
    
    // Angular Material Modules
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatExpansionModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    MsalService,
    MsalGuard,
    AuthService,
    OpenAIService,
    LogAnalyticsService,
    SentinelQueryService
  ],
  bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
