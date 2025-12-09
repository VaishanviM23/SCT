import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent {
  constructor(private router: Router) {}

  secureScore = {
    score: 51.54,
    pointsAchieved: 546.31,
    totalPoints: 1060,
    categories: [
      { name: 'Identity', achieved: 614.24, total: 744, percentage: 82.56 },
      { name: 'Data', achieved: 155.15, total: 280, percentage: 55.41 },
      { name: 'Device', achieved: 52.96, total: 108, percentage: 49.04 },
      { name: 'Apps', achieved: 36.84, total: 44, percentage: 83.73 },
      { name: 'Cloud', achieved: 129.6, total: 301.4, percentage: 43.0 }
    ]
  };

  // NEW: AI Insights replacing Environment Risk
  aiInsights = {
    analysisTimestamp: new Date(),
    confidenceScore: 92,
    totalInsights: 8,
    criticalAlerts: 2,
    insights: [
      {
        id: 1,
        category: 'Threat Detection',
        priority: 'high',
        title: 'Unusual Login Pattern Detected',
        description: 'AI detected 15% increase in failed login attempts from Eastern Europe IPs in the last 24h',
        confidence: 94,
        recommendation: 'Enable conditional access policies for high-risk regions',
        icon: 'security'
      },
      {
        id: 2,
        category: 'Vulnerability Assessment',
        priority: 'critical',
        title: 'Critical Vulnerability Exposure',
        description: 'ML analysis identifies 3 servers with CVE-2024-1234 requiring immediate patching',
        confidence: 98,
        recommendation: 'Deploy patches within 24 hours to prevent potential exploitation',
        icon: 'bug_report'
      },
      {
        id: 3,
        category: 'Behavioral Analytics',
        priority: 'medium',
        title: 'Anomalous Data Access Pattern',
        description: 'AI baseline analysis shows 200% increase in SharePoint access by user john.doe@company.com',
        confidence: 87,
        recommendation: 'Review user access permissions and implement data loss prevention policies',
        icon: 'analytics'
      },
      {
        id: 4,
        category: 'Predictive Security',
        priority: 'low',
        title: 'Potential Phishing Campaign',
        description: 'AI model predicts 73% likelihood of targeted phishing campaign based on threat intelligence',
        confidence: 73,
        recommendation: 'Increase security awareness training and enable advanced threat protection',
        icon: 'psychology'
      }
    ],
    riskTrends: {
      thisWeek: 23,
      lastWeek: 31,
      trend: 'decreasing'
    }
  };

  performanceMetrics = {
    meanTimeToRemediate: { value: 92.07, unit: 'Days' },
    criticalMTTR: { value: 80.74, days: 7 },
    highMTTR: { value: 91.94, days: 30 },
    incidentsPastSLA: { value: 26.20, unit: '%' }
  };

  connectedSystems = {
    totalSystems: 5,
    connectedCount: 5,
    systems: [
      { 
        name: 'Rapid7', 
        status: 'connected', 
        lastSync: '5 min ago',
        syncStatus: 'success',
        dataVolume: '2.4 MB/day'
      },
      { 
        name: 'CrowdStrike', 
        status: 'connected', 
        lastSync: '2 min ago',
        syncStatus: 'success',
        dataVolume: '5.7 MB/day'
      },
      { 
        name: 'Qualys', 
        status: 'warning', 
        lastSync: '1 hr ago',
        syncStatus: 'delayed',
        dataVolume: '1.8 MB/day'
      },
      { 
        name: 'ServiceNow', 
        status: 'connected', 
        lastSync: '15 min ago',
        syncStatus: 'success',
        dataVolume: '3.2 MB/day'
      },
      { 
        name: 'Tenable', 
        status: 'error', 
        lastSync: '2 hr ago',
        syncStatus: 'failed',
        dataVolume: '0.8 MB/day'
      }
    ]
  };

  // Computed properties for template
  get totalDetections(): number {
    return 500;
  }

  get highPriorityInsights(): number {
    return this.aiInsights.insights.filter(insight => 
      insight.priority === 'high' || insight.priority === 'critical'
    ).length;
  }

  get averageConfidence(): number {
    const total = this.aiInsights.insights.reduce((sum, insight) => sum + insight.confidence, 0);
    return Math.round(total / this.aiInsights.insights.length);
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'check_circle';
      default: return 'help';
    }
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
