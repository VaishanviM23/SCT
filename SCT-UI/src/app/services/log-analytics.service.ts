import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { 
  LogAnalyticsQuery, 
  LogAnalyticsResponse, 
  QueryResult
} from '../models/mcp.models';

/**
 * Service for querying Azure Log Analytics / Microsoft Sentinel
 * Uses the Log Analytics REST API to execute KQL queries
 */
@Injectable({
  providedIn: 'root'
})
export class LogAnalyticsService {
  private readonly workspaceId = environment.msalConfigs.logAnalytics.workspaceId;
  private readonly baseUrl = environment.msalConfigs.logAnalytics.url;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Execute a KQL query against Log Analytics workspace
   * @param kqlQuery - The KQL query string to execute
   * @param timespan - ISO 8601 duration format (e.g., 'P1D' for 1 day, 'PT1H' for 1 hour)
   * @returns Observable with query results
   */
  executeQuery(kqlQuery: string, timespan: string = 'P1D'): Observable<QueryResult> {
    return this.getAccessToken().pipe(
      switchMap(token => {
        const url = `${this.baseUrl}/${this.workspaceId}/query`;
        
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        });

        // FIXED: Proper request body format for Log Analytics API
        const body = {
          query: kqlQuery,
          timespan: timespan
        };

        console.log('📊 Executing KQL Query:', kqlQuery);
        console.log('⏱️ Timespan:', timespan);
        console.log('🔗 URL:', url);
        console.log('📦 Request Body:', JSON.stringify(body, null, 2));

        return this.http.post<LogAnalyticsResponse>(url, body, { headers }).pipe(
          tap(response => console.log('✅ Raw API Response:', response)),
          map(response => this.parseResponse(kqlQuery, response)),
          catchError(error => {
            console.error('❌ Query execution error:', error);
            console.error('❌ Error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              errorBody: error.error
            });
            
            let errorMessage = 'Query failed';
            
            // Parse the actual error from Log Analytics API
            if (error.error?.error?.message) {
              errorMessage = error.error.error.message;
            } else if (error.error?.error?.innererror?.message) {
              errorMessage = error.error.error.innererror.message;
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            return throwError(() => ({
              success: false,
              error: errorMessage,
              executedQuery: kqlQuery
            } as QueryResult));
          })
        );
      }),
      catchError(error => {
        console.error('❌ Token acquisition error:', error);
        return throwError(() => ({
          success: false,
          error: `Authentication failed: ${error.message}`,
          executedQuery: kqlQuery
        } as QueryResult));
      })
    );
  }

  /**
   * Get access token for Log Analytics API
   */
  private getAccessToken(): Observable<string> {
    return from(
      this.authService.getLogAnalyticsToken()
    ).pipe(
      map(result => {
        if (!result || !result.accessToken) {
          throw new Error('Failed to acquire token for Log Analytics');
        }
        console.log('✅ Acquired Log Analytics token successfully');
        console.log('🎫 Token scopes:', result.scopes);
        console.log('🎫 Token expiry:', new Date(result.expiresOn || 0));
        return result.accessToken;
      }),
      catchError(error => {
        console.error('Token acquisition failed:', error);
        throw error;
      })
    );
  }

  /**
   * Parse Log Analytics response into a friendly format
   */
  private parseResponse(query: string, response: LogAnalyticsResponse): QueryResult {
    if (!response.tables || response.tables.length === 0) {
      return {
        success: true,
        data: [],
        columns: [],
        executedQuery: query,
        rowCount: 0
      };
    }

    const table = response.tables[0];
    const columns = table.columns;
    const columnNames = columns.map(c => c.name);
    
    // Convert rows array to objects with column names
    const data = table.rows.map(row => {
      const obj: any = {};
      columnNames.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });

    console.log(`✅ Query successful: ${data.length} rows returned`);

    return {
      success: true,
      data: data,
      columns: columns,
      executedQuery: query,
      rowCount: data.length
    };
  }
}