import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { DashboardComponent } from './screens/dashboard/dashboard.component';
import { SentribotComponent } from './screens/sentribot/sentribot.component';
import { OverviewComponent } from './screens/overview/overview.component';

const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/threat-incident-report', 
    pathMatch: 'full' 
  },
  { 
    path: 'threat-incident-report', 
    component: DashboardComponent,
    canActivate: [MsalGuard]
  },
  { 
    path: 'identity-access', 
    component: DashboardComponent,
    canActivate: [MsalGuard]
  },
  { 
    path: 'asset-endpoint-security', 
    component: DashboardComponent,
    canActivate: [MsalGuard]
  },
  { 
    path: 'cloud-workload-security', 
    component: DashboardComponent,
    canActivate: [MsalGuard]
  },
  { 
    path: 'compliance-governance', 
    component: DashboardComponent,
    canActivate: [MsalGuard]
  },
  { 
    path: 'network-security', 
    component: DashboardComponent,
    canActivate: [MsalGuard]
  },
  { 
    path: 'resilience-recovery', 
    component: DashboardComponent,
    canActivate: [MsalGuard]
  },
  { 
    path: 'user-awareness', 
    component: DashboardComponent,
    canActivate: [MsalGuard]
  },
  { 
    path: 'overview', 
    component: OverviewComponent,
    canActivate: [MsalGuard]
  },
  // SentriBot route - Make sure it comes before any wildcard routes
  { 
    path: 'sentribot', 
    component: SentribotComponent,
    canActivate: [MsalGuard],
    data: { 
      title: 'SentriBot - AI Security Analysis',
      icon: 'smart_toy'
    }
  },
  // Wildcard route should be LAST
  { 
    path: '**', 
    redirectTo: '/threat-incident-report' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false // Set to true for debugging
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

