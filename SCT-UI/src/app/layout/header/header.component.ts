import { Component, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { AuthService } from '../../services/auth.service';
import { AccountInfo, PublicClientApplication } from '@azure/msal-browser';
import { MsalConfig } from '../../msal/msal.config';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  username: string | undefined;
  email: string | undefined;

  constructor(private sidebarService: SidebarService, private authService: AuthService) {}

  async ngOnInit(): Promise<void> {
    const msalInstance = new PublicClientApplication(MsalConfig);
    await msalInstance.initialize();
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.username = currentUser.name;
      this.email = currentUser.username;
    }
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  logout() {
    this.authService.logout();
  }

}
