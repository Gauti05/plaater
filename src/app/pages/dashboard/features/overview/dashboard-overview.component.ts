import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { KpiCardComponent } from '../../kpi-card.component';
import { Order, DashboardData } from '../../core/dashboard.model';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, KpiCardComponent],
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.css']
})
export class DashboardOverviewComponent implements OnChanges {
  @Input() dashboardData: DashboardData | null = null;
  @Input() recentOrders: Order[] = [];
  @Input() mainChartOptions: any;
  @Input() donutChartOptions: any;
  @Input() isLoading: boolean = false;
  
  @Input() currentPage: number = 1;
  @Input() itemsPerPage: number = 5;
  @Input() totalItems: number = 0; 
  @Input() isLastPage: boolean = false; 
  
  @Input() searchText: string = '';
  @Input() showFilters: boolean = false;
  @Input() filterStatus: string = '';
  @Input() filterMethod: string = '';
  @Input() filterLocation: string = '';
  @Input() selectedChartFilter: string = 'Daily';

  // 🔥 EVENT EMITTERS FOR FILTERS
  @Output() searchChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() itemsPerPageChange = new EventEmitter<number>(); 
  @Output() toggleFilters = new EventEmitter<Event>();
  @Output() addDummyData = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();
  
  @Output() chartFilterChange = new EventEmitter<string>();
  @Output() filterStatusChange = new EventEmitter<string>();
  @Output() filterMethodChange = new EventEmitter<string>();
  @Output() filterLocationChange = new EventEmitter<string>();

  uniqueStatuses = ['Completed', 'Processing', 'Failed'];
  uniqueMethods = ['Card', 'Cash', 'Online'];
  uniqueLocations = ['New York HQ', 'London Store', 'Online'];
  rowOptions = [5, 10, 20, 50];

  public tempPage: number = 1;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentPage']) {
      this.tempPage = this.currentPage;
    }
  }

  trackByOrderId(index: number, order: Order): string { return order.id; }
  trackByKpi(index: number, kpi: any): string { return kpi.label; }

  get totalPages(): number {
      return this.itemsPerPage > 0 ? Math.ceil(this.totalItems / this.itemsPerPage) : 0;
  }

  onChartFilterChange() { this.chartFilterChange.emit(this.selectedChartFilter); }
  onRowsChange() { this.itemsPerPageChange.emit(this.itemsPerPage); }

  // 🔥 EMITTERS FOR DROPDOWNS
  onStatusChange(val: string) { this.filterStatusChange.emit(val); }
  onMethodChange(val: string) { this.filterMethodChange.emit(val); }
  onLocationChange(val: string) { this.filterLocationChange.emit(val); }

  goToPage() {
    if (this.tempPage >= 1 && this.tempPage <= this.totalPages) {
        this.pageChange.emit(this.tempPage);
    } else {
        this.tempPage = this.currentPage;
    }
  }

  initBaseChartSettings() {
     this.mainChartOptions = {
      chart: { type: "area", height: 260, fontFamily: 'Inter', background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
      colors: ['#3b82f6'],
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 100] }},
      dataLabels: { enabled: false }, 
      stroke: { curve: 'smooth', width: 2 },
      yaxis: { labels: { formatter: (val:number) => (val/1000).toFixed(1) + 'k', style: { colors: '#94a3b8' } } },
      xaxis: { labels: { style: { colors: '#94a3b8' } } },
      grid: { borderColor: '#334155', strokeDashArray: 4 }
    };
  }

  initDonutChart(data: DashboardData) {
    this.donutChartOptions = {
      series: data.channelSales.series, labels: data.channelSales.labels,
      chart: { type: "donut", height: 230, fontFamily: 'Inter', background: 'transparent' },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      legend: { position: 'right', labels: { colors: '#94a3b8' } }
    };
  }
}