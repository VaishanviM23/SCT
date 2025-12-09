import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AccountInfo } from '@azure/msal-browser';
import * as powerbi from 'powerbi-client';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements  AfterViewInit {
   @ViewChild('reportContainer', { static: false }) reportContainer!: ElementRef;
   route=''

  constructor(private auth: AuthService, private router: Router) {
    this.route = this.router.url;
    console.log(this.route);
   }
 
  public account!: AccountInfo;
   async  ngAfterViewInit() {
     const token = await this.auth.getPowerBiAccessToken()!;
    //  this.embedReport(token);
   }

    embedReport(accessToken: string) {
    const embedConfig: powerbi.IEmbedConfiguration = {
      type: 'report',
      id: 'd6007764-e30a-4dcd-94ed-0f3e5ef588c0',
      embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=d6007764-e30a-4dcd-94ed-0f3e5ef588c0&appId=dffef4a0-74f8-4c8d-a451-e8207c7dbc6a&autoAuth=true&ctid=687f51c3-0c5d-4905-84f8-97c683a5b9d1&actionBarEnabled=true',
      accessToken: accessToken,
      tokenType: powerbi.models.TokenType.Embed, // <-- Aad since it's user owns data
      settings: {
        panes: {
          filters: { visible: false },
          pageNavigation: { visible: false }
        },
        background: powerbi.models.BackgroundType.Transparent
      }
    };

    const powerbiService = new powerbi.service.Service(
      powerbi.factories.hpmFactory,
      powerbi.factories.wpmpFactory,
      powerbi.factories.routerFactory
    );

     powerbiService.reset(this.reportContainer.nativeElement);
    powerbiService.embed(this.reportContainer.nativeElement, embedConfig);
  }

}
