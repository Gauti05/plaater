import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// 🔥 FIX: Correct path to find the model from the 'services' folder
import { DashboardData } from '../pages/dashboard/core/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  
  constructor() {}

  getDashboardMetrics(): Observable<DashboardData> {
    // Dummy Data to prevent errors
    return of({
      kpis: [
        { value: '₹45.2k', label: 'Total Revenue', trendPercentage: 12, isPositive: true },
        { value: '1,240', label: 'Total Orders', trendPercentage: 5, isPositive: true },
        { value: '85', label: 'New Customers', trendPercentage: 2, isPositive: false },
        { value: '₹12.5k', label: 'Expenses', trendPercentage: 8, isPositive: false }
      ],
      channelSales: {
        series: [45, 25, 20, 10],
        labels: ['Dine-in', 'Takeaway', 'Delivery', 'Online']
      },
      salesStats: [],
      orderSummary: [],
      inventoryStatus: []
    });
  }
}