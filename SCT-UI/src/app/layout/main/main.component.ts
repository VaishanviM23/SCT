import { Component, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements OnInit {
  sidebarVisible = false;

  constructor(private sidebarService: SidebarService) {}

  ngOnInit() {
    this.sidebarService.sidebarVisible$.subscribe(visible => {
      this.sidebarVisible = visible;
    });
  }
}
