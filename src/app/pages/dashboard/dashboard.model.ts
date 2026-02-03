import { ApexOptions } from "ng-apexcharts";
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export type UserRole = string;

export interface UserPermissions {
  canViewDashboard: boolean; canViewOrders: boolean; canCreateOrder: boolean;  
  canManageInventory: boolean; canViewReports: boolean; canManageUsers: boolean;
  canDeleteUsers: boolean; canViewCustomers: boolean; canManageSettings: boolean; canViewAuditLog: boolean;
}

export interface CustomRole { name: string; permissions: UserPermissions; isSystemDefault: boolean; }
export interface UserProfile { name: string; role: UserRole; permissions: UserPermissions; initials: string; email?: string; }
export interface ManagedUser { id: number | string; name: string; email: string; role: UserRole; status: 'Active' | 'Inactive'; }
export interface Product { id: number; name: string; price: number; color: string; icon: string; }
export interface CartItem extends Product { quantity: number; }

export interface Order { 
    id: string; 
    customer: string; 
    method: string; 
    location: string; 
    amount: number; 
    status: 'Completed' | 'Processing' | 'Failed'; 
    time: string; 
    createdAt?: any; 
}

export interface StandardReport { id: string; title: string; description: string; icon: string; lastGenerated: string; }

export interface DashboardData {
    kpis: any[]; // Or specific KPI interface
    channelSales: { series: number[], labels: string[] };
}


// Add this to your core/dashboard.model.ts file
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}