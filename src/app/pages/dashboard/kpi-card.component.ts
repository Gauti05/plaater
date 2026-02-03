import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { KpiMetric } from './core/dashboard.model';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  // 🔥 ViewEncapsulation.None ensures global dark mode variables work here
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="kpi-card">
        <div class="card-header">
            <span class="kpi-label">{{ metric.title || metric.label }}</span>
            <div *ngIf="metric.trendPercentage !== undefined" 
                 class="trend-badge"
                 [ngClass]="metric.isPositive ? 'positive' : 'negative'">
                <span class="arrow">{{ metric.isPositive ? '↑' : '↓' }}</span>
                <span>{{ metric.trendPercentage }}%</span>
            </div>
        </div>

        <div class="card-body">
            <h3 class="kpi-value">{{ metric.value }}</h3>
        </div>

        <div class="card-chart-wrapper" *ngIf="chartOptions && metric.sparklineData">
            <apx-chart
                [series]="chartOptions.series"
                [chart]="chartOptions.chart"
                [stroke]="chartOptions.stroke"
                [colors]="chartOptions.colors"
                [fill]="chartOptions.fill"
                [tooltip]="chartOptions.tooltip"
                [states]="chartOptions.states"
                [markers]="chartOptions.markers"
                [grid]="chartOptions.grid">
            </apx-chart>
        </div>
    </div>
  `,
  styles: [`
    /* THEME VARIABLES FOR THIS COMPONENT */
    :host {
        --card-bg: #ffffff;
        --card-border: #e2e8f0;
        --card-text: #0f172a;
        --card-label: #64748b;
    }

    /* 🔥 DARK MODE OVERRIDES */
    :host-context(body.dark-mode) {
        --card-bg: #1e293b;      /* Slate 800 */
        --card-border: #334155;  /* Slate 700 */
        --card-text: #f8fafc;    /* White */
        --card-label: #94a3b8;   /* Light Grey */
    }

    /* HIDE TOOLBAR */
    .apexcharts-toolbar { display: none !important; }

    /* CARD STYLES */
    .kpi-card {
        background: var(--card-bg);        /* 🔥 Dynamic */
        border: 1px solid var(--card-border); /* 🔥 Dynamic */
        border-radius: 12px;
        padding: 24px 24px 0 24px;
        height: 100%;
        min-height: 165px; 
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;
        overflow: hidden;
    }

    .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        border-color: #cbd5e1; /* Subtle hover effect */
    }
    :host-context(body.dark-mode) .kpi-card:hover { border-color: #475569; }

    /* HEADER */
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .kpi-label {
        font-size: 0.875rem;
        color: var(--card-label); /* 🔥 Dynamic */
        font-weight: 600;
        letter-spacing: 0.01em;
    }

    /* BADGE */
    .trend-badge {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 99px;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .trend-badge.positive { background-color: #dcfce7; color: #166534; }
    .trend-badge.negative { background-color: #fee2e2; color: #991b1b; }

    /* BODY */
    .card-body { 
        margin-bottom: auto; 
        z-index: 1; 
    }

    .kpi-value {
        font-size: 2.25rem;
        font-weight: 700;
        color: var(--card-text); /* 🔥 Dynamic */
        margin: 0;
        line-height: 1;
        letter-spacing: -0.03em;
    }

    /* CHART WRAPPER */
    .card-chart-wrapper {
        margin-left: -26px;  
        margin-right: -26px; 
        margin-bottom: -15px;
        height: 100px;
        display: flex;
        align-items: flex-end;
        position: relative;
    }
  `]
})
export class KpiCardComponent implements OnChanges {
  @Input() metric!: KpiMetric;
  public chartOptions: any;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['metric'] && this.metric && this.metric.sparklineData) {
      this.initChart();
    }
  }

  initChart() {
    const color = this.metric.isPositive ? '#10b981' : '#ef4444';

    this.chartOptions = {
      series: [{ name: "Value", data: this.metric.sparklineData }],
      chart: {
        type: "area",
        height: 100,
        width: "100%",
        sparkline: { enabled: true },
        toolbar: { show: false },
        animations: { enabled: false },
        parentHeightOffset: 0
      },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 100] }
      },
      colors: [color],
      tooltip: { enabled: false },
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } }
      },
      markers: { size: 0 },
      grid: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
      dataLabels: { enabled: false }
    };
  }
}