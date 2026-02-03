import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DashboardData } from './core/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor() { }

  getDashboardMetrics(): Observable<DashboardData> {
    // 🔥 FIXED: Data structure now matches the Interface exactly
    return of({
      kpis: [
        { 
          label: 'Total Users', 
          title: 'Total Users',
          value: '12,450', 
          icon: '👤', 
          color: 'blue',
          trendPercentage: 12.5,
          isPositive: true,
          sparklineData: [10, 15, 12, 20, 25, 30, 40]
        },
        { 
          label: 'Active Users', 
          title: 'Active Users',
          value: '1,240', 
          icon: '🔵', 
          color: 'indigo',
          trendPercentage: 5.2,
          isPositive: true,
          sparklineData: [50, 60, 55, 70, 65, 80, 85]
        },
        { 
          label: 'Total Revenue', 
          title: 'Total Revenue',
          value: '₹4,25,000', 
          icon: '₹', 
          color: 'green',
          trendPercentage: 2.1,
          isPositive: false,
          sparklineData: [100, 90, 80, 95, 110, 105, 120]
        },
        { 
          label: 'Low Stock', 
          title: 'Low Stock Items',
          value: '8 Items', 
          icon: '⚠️', 
          color: 'orange',
          trendPercentage: 0,
          isPositive: true,
          sparklineData: [5, 5, 6, 8, 8, 7, 8]
        }
      ],
      salesVsOrders: {
        dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        sales: [12000, 15000, 13000, 18000, 16000, 21000, 19000],
        orders: [120, 150, 130, 180, 160, 210, 190]
      },
      channelSales: {
        series: [45, 25, 20, 10],
        labels: ['Online', 'In-Store', 'Phone', 'Partner']
      },
      salesStats: [ { label: 'Orders', value: '1,230' }, { label: 'Avg Order Value', value: '₹345' }, { label: 'Refunds', value: '₹8,400' } ],
      orderSummary: [ { label: 'Completed Orders', value: 980 }, { label: 'Pending Orders', value: 120 }, { label: 'Cancelled Orders', value: 75 }, { label: 'Failed Orders', value: 18 } ],
      inventoryStatus: [ { name: 'Rice', status: '5 kg left', color: '#ea580c' }, { name: 'Oil', status: '2 units', color: '#dc2626' }, { name: 'Sugar', status: '1 kg', color: '#ea580c' } ]
    });
  }
}