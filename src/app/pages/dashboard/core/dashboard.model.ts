import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export interface UserProfile {
  name: string;
  role: UserRole;
  initials: string;
  email?: string;
  permissions: UserPermissions;
}

export type UserRole = 'Super Admin' | 'Admin' | 'User' | string;

export interface UserPermissions {
  canViewDashboard: boolean;
  canViewOrders: boolean;
  canCreateOrder: boolean;
  canManageInventory: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canDeleteUsers: boolean;
  canViewCustomers: boolean;
  canManageSettings: boolean;
  canViewAuditLog: boolean;
}

// 🔥 FIXED: Unified Interface to support BOTH Simple and Rich KPI Cards
export interface KpiMetric {
  value: string;
  
  // Optional fields to support different card styles
  label?: string;       // Simple view
  title?: string;       // Rich view
  icon?: string;        // Simple view
  color?: string;       // Text/Icon color
  
  // Rich features (Trends & Sparklines)
  trendPercentage?: number;
  isPositive?: boolean;
  sparklineData?: number[];
}

export interface DashboardData {
  kpis: KpiMetric[];
  channelSales: {
    series: number[];
    labels: string[];
  };
  salesStats?: any[];
  orderSummary?: any[];
  inventoryStatus?: any[];
  salesVsOrders?: { dates: string[], sales: number[], orders: number[] }; // Added to match Service
}

export interface Order {
  id: string;
  customer: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Processing' | 'Failed' | 'Cancelled';
  method: string;
  location: string;
  time: string;
  createdAt?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  color: string;
  icon: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
}

export interface CustomRole {
  name: string;
  permissions: UserPermissions;
  isSystemDefault: boolean;
}

export interface StandardReport {
  id: string;
  title: string;
  description: string;
  icon: string;
  lastGenerated: string;
}


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

export interface Store {
  id: string;
  name: string;
  location: string;
  manager: string;
  contact: string;
  status: 'Open' | 'Closed' | 'Renovation';
  revenue: number;
  plan: string;
  licenseKey: string;
  slug: string;
  updatedAt: string
}