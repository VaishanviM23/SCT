import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  OpenAIChatRequest,
  OpenAIChatResponse,
  OpenAIMessage,
  OpenAIFunction
} from '../models/mcp.models';

@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private readonly apiUrl = environment.msalConfigs.openai.apiUrl;
  private readonly apiKey = environment.msalConfigs.openai.apiKey;
  private readonly model = environment.msalConfigs.openai.model;

  constructor(private http: HttpClient) {}

  /**
   * Send a chat completion request to OpenAI
   */
  chatCompletion(
    messages: OpenAIMessage[],
    functions?: OpenAIFunction[],
    functionCall?: 'auto' | 'none' | { name: string }
  ): Observable<OpenAIChatResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    });

    const request: OpenAIChatRequest = {
      model: this.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    };

    if (functions && functions.length > 0) {
      request.functions = functions;
      request.function_call = functionCall || 'auto';
    }

    return this.http.post<OpenAIChatResponse>(this.apiUrl, request, { headers }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Simple text completion helper
   */
  ask(userMessage: string, systemPrompt?: string): Observable<string> {
    const messages: OpenAIMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: userMessage });

    return this.chatCompletion(messages).pipe(
      map(response => {
        if (response.choices && response.choices.length > 0) {
          return response.choices[0].message.content || '';
        }
        throw new Error('No response from OpenAI');
      })
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred while communicating with OpenAI';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status) {
      if (error.status === 401) {
        errorMessage = 'Invalid OpenAI API key. Please check your configuration.';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else {
        errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }

    console.error('OpenAI API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}