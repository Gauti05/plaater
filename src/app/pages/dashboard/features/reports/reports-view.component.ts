import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-reports-view',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './reports-view.component.html',
  styleUrls: ['./reports-view.component.css']
})
export class ReportsViewComponent {
  @Input() reportKpis: any[] = [];
  @Input() salesStats: any[] = [];
  @Input() orderSummary: any[] = [];
  @Input() inventoryStatus: any[] = [];
  
  // Accept Dark Mode status from Dashboard
  @Input() isDarkMode: boolean = false; 

  // Chart Configuration
  @Input('mainChartOptions') chartOptions: any; 

  public selectedDateRange: string = 'Last 30 Days';
  public selectedBranch: string = 'All Branches';
}