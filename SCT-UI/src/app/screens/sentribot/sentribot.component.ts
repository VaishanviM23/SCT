import { Component, OnInit } from '@angular/core';
import { SentinelQueryService } from '../../services/sentinel-query.service';
import { SentinelQueryResult } from '../../models/mcp.models';

@Component({
  selector: 'app-sentribot',
  templateUrl: './sentribot.component.html',
  styleUrls: ['./sentribot.component.scss']
})
export class SentribotComponent implements OnInit {
  query: string = '';
  results: SentinelQueryResult[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  // Example queries for user guidance - updated with CVE context
  exampleQueries: string[] = [
    'Show me any incidents captured by Qualys',
    'Find all CVEs affecting the hr-portal application',
    'Which applications have the most high-severity CVE incidents?',
    'Show me CVE-2025-4598 incidents across all applications',
    'Find the top three users that are at risk and explain why they are at risk',
    'Find sign-in failures in the last 24 hours and give me a brief summary of key findings',
    'Show me all active high-severity security incidents',
    'List recent security alerts related to privilege escalation',
    'Find users who signed in from unusual locations in the past week'
  ];

  constructor(private sentinelQueryService: SentinelQueryService) {}

  ngOnInit(): void {
    console.log('🤖 SentriBot initialized - AI-powered Sentinel analysis ready');
  }

  /**
   * Submit natural language query to SentriBot
   */
  submitQuery(): void {
    if (!this.query.trim()) {
      this.errorMessage = 'Please enter a query';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('🤖 SentriBot processing query:', this.query);

    this.sentinelQueryService.querySentinel(this.query).subscribe({
      next: (result) => {
        console.log('📥 SentriBot result received:', result);
        this.results.unshift(result); // Add to beginning of results
        this.isLoading = false;
        
        if (!result.isError) {
          this.query = ''; // Clear input after successful query
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to query Sentinel';
        this.isLoading = false;
        console.error('❌ SentriBot error:', error);
      }
    });
  }

  /**
   * Use an example query
   */
  useExampleQuery(example: string): void {
    this.query = example;
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results = [];
    this.errorMessage = '';
  }

  /**
   * Handle Enter key in textarea (Shift+Enter for new line)
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitQuery();
    }
  }

  /**
   * Format data for display (converts array to formatted string)
   */
  formatData(data: any[] | undefined): string {
    if (!data || data.length === 0) {
      return 'No data returned';
    }

    // Create a simple table format
    const keys = Object.keys(data[0]);
    let table = keys.join(' | ') + '\n';
    table += keys.map(() => '---').join(' | ') + '\n';
    
    data.forEach(row => {
      table += keys.map(key => row[key] ?? '').join(' | ') + '\n';
    });

    return table;
  }
}