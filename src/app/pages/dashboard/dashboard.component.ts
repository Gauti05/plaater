import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router'; 
import { NgApexchartsModule } from 'ng-apexcharts';

// Services
import { DashboardService } from './dashboard.service'; 
import { FirestoreService } from '../../services/firestore.service'; 

// Models
import { 
  DashboardData, UserProfile, Order, ManagedUser, CustomRole, 
  KpiMetric, InventoryItem 
} from './core/dashboard.model';

// Components
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { DashboardOverviewComponent } from './features/overview/dashboard-overview.component';
import { CrmViewComponent } from './features/crm/crm-view.component';
import { PosTerminalComponent } from './features/pos-terminal/pos-terminal.component';
import { ReportsViewComponent } from './features/reports/reports-view.component';
import { UserManagementComponent } from './features/users/user-management.component';
import { InventoryManagerComponent } from './features/inventory/inventory-manager.component';
import { StoreManagementComponent } from './features/stores/store-management.component';
// 🔥 NEW: Import Support Component
import { SupportTicketsComponent } from './features/support/support-tickets.component';

// Firebase
import { auth, db } from '../../firebase'; 
import { signOut, onAuthStateChanged, getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app'; 
import { 
  writeBatch, doc, collection, setDoc, serverTimestamp, getDoc, addDoc, 
  getDocs, deleteDoc, query, orderBy
} from 'firebase/firestore';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    SidebarComponent, 
    TopbarComponent, 
    DashboardOverviewComponent, 
    CrmViewComponent, 
    PosTerminalComponent, 
    ReportsViewComponent, 
    UserManagementComponent,
    InventoryManagerComponent,
    StoreManagementComponent,
    SupportTicketsComponent // 🔥 Added to imports
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  public dashboardData: DashboardData | null = null;
  public currentUser: UserProfile = { 
      name: 'Guest', role: 'User', initials: 'G', email: '', 
      permissions: { canViewDashboard: true, canViewOrders: true, canCreateOrder: true, canManageInventory: true, canViewReports: true, canManageUsers: true, canDeleteUsers: true, canViewCustomers: true, canManageSettings: true, canViewAuditLog: true } 
  };
  
  public currentView: string = 'Dashboard';
  public isSidebarOpen: boolean = true;
  public isDarkMode: boolean = false;
  public isUserLoading: boolean = true;
  public isLoading: boolean = false; 

  public showFilters: boolean = false; 
  public searchText: string = '';      
  public filterStatus: string = '';    
  public filterMethod: string = '';    
  public filterLocation: string = ''; 
  public selectedChartFilter: string = 'Daily'; 

  private searchSubject = new Subject<string>();

  public itemsPerPage: number = 5; 
  public currentPage: number = 1;
  public totalItems: number = 0; 
  public isLastPage: boolean = false;
  
  public allOrders: Order[] = [];       
  public filteredOrders: Order[] = [];  
  public recentOrders: Order[] = [];    
  
  public managedUsers: ManagedUser[] = []; 
  
  public availableRoles: CustomRole[] = [
    { name: 'Super Admin', isSystemDefault: true, permissions: { canViewDashboard: true, canViewOrders: true, canCreateOrder: true, canManageInventory: true, canViewReports: true, canManageUsers: true, canDeleteUsers: true, canViewCustomers: true, canManageSettings: true, canViewAuditLog: true } },
    { name: 'Admin', isSystemDefault: true, permissions: { canViewDashboard: true, canViewOrders: true, canCreateOrder: true, canManageInventory: true, canViewReports: true, canManageUsers: true, canDeleteUsers: false, canViewCustomers: true, canManageSettings: false, canViewAuditLog: true } },
    { name: 'Store Admin', isSystemDefault: true, permissions: { canViewDashboard: true, canViewOrders: true, canCreateOrder: true, canManageInventory: true, canViewReports: true, canManageUsers: true, canDeleteUsers: false, canViewCustomers: true, canManageSettings: true, canViewAuditLog: false } },
    { name: 'User', isSystemDefault: true, permissions: { canViewDashboard: true, canViewOrders: true, canCreateOrder: true, canManageInventory: false, canViewReports: false, canManageUsers: false, canDeleteUsers: false, canViewCustomers: false, canManageSettings: false, canViewAuditLog: false } }
  ];

  public crmCustomers: any[] = [
    { id: 'C-101', name: 'Arjun Verma', email: 'arjun@demo.com', orders: 12, spent: 4500, lastActive: '2 hours ago' },
    { id: 'C-102', name: 'Sara Khan', email: 'sara@demo.com', orders: 5, spent: 1200, lastActive: '1 day ago' },
    { id: 'C-103', name: 'Mike Ross', email: 'mike@demo.com', orders: 22, spent: 8900, lastActive: '3 days ago' },
    { id: 'C-104', name: 'Priya D', email: 'priya@demo.com', orders: 1, spent: 150, lastActive: '1 week ago' },
    { id: 'C-105', name: 'John Wick', email: 'john@hotel.com', orders: 50, spent: 25000, lastActive: 'Just now' }
  ]; 
  
  public reportKpis: KpiMetric[] = [];
  public salesStats: any[] = [];
  public orderSummary: any[] = [];
  public inventoryStatus: any[] = [];
  public inventoryItems: InventoryItem[] = [];

  public mainChartOptions: any = { series: [], chart: { type: "area", height: 280 }, xaxis: { categories: [] } }; 
  public donutChartOptions: any = { series: [], chart: { type: "donut", height: 250 }, labels: [] };
  public chartDataSets: any = { 'Hourly': { data: [], categories: [] }, 'Daily': { data: [], categories: [] }, 'Yearly': { data: [], categories: [] } };
  
  constructor(
      private dashboardService: DashboardService, 
      private router: Router, 
      private firestoreService: FirestoreService, 
      private cdr: ChangeDetectorRef, 
      private ngZone: NgZone,
      @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
        const cachedUser = localStorage.getItem('user_profile');
        if (cachedUser) {
            const parsed = JSON.parse(cachedUser);
            const role = this.normalizeRole(parsed.role || 'User');
            this.currentUser = { ...parsed, role: role, permissions: this.getPermissionsForRole(role) };
            this.isUserLoading = false; 
            this.fetchAllOrders(); 
            this.fetchManagedUsers();
            this.fetchCustomRoles();
            this.fetchInventory();
        } else {
            this.isUserLoading = true; 
        }
    }
    this.loadCurrentUser();
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => { this.applyFilters(); });
    this.dashboardService.getDashboardMetrics().subscribe((data: DashboardData) => {
      this.dashboardData = data; this.reportKpis = data.kpis; this.salesStats = data.salesStats || []; this.orderSummary = data.orderSummary || []; this.inventoryStatus = data.inventoryStatus || [];
      this.initBaseChartSettings(); this.updateChartFilter(); this.initDonutChart(data);
    });
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme'); if (savedTheme === 'dark') this.toggleTheme(true);
    }
  }

  loadCurrentUser() {
    if (isPlatformBrowser(this.platformId)) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'Users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                let userRole = 'User';
                let userName = 'User';

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const rawRole = userData['userRole'] || userData['role'] || 'User';
                    userRole = this.normalizeRole(rawRole);
                    userName = userData['name'] || 'User';
                    
                    this.currentUser = { 
                      name: userName, 
                      role: userRole, 
                      initials: this.getInitials(userName), 
                      email: userData['email'], 
                      permissions: this.getPermissionsForRole(userRole) 
                    };
                    localStorage.setItem('user_profile', JSON.stringify(this.currentUser));
                }
                
                this.fetchCustomRoles(); 
                this.fetchManagedUsers();
                if(this.allOrders.length === 0) this.fetchAllOrders();
                this.fetchInventory(); 
            }
            this.isUserLoading = false; this.cdr.detectChanges();
        });
    }
  }

  normalizeRole(role: string): string {
    if (!role) return 'User';
    const r = role.toLowerCase().trim();
    if (r === 'superadmin' || r === 'super admin') return 'Super Admin';
    if (r === 'admin') return 'Admin';
    if (r === 'storeadmin' || r === 'store admin') return 'Store Admin';
    return 'User';
  }

  getPermissionsForRole(role: string) { 
    const foundRole = this.availableRoles.find(r => r.name === role);
    return foundRole ? foundRole.permissions : this.availableRoles.find(r => r.name === 'User')!.permissions;
  }

  logout() { if (isPlatformBrowser(this.platformId) && confirm('Secure Logout: Are you sure?')) { signOut(auth).then(() => { localStorage.removeItem('user_profile'); localStorage.removeItem('authUser'); sessionStorage.clear(); this.router.navigate(['/login']); }); } }

  async fetchAllOrders() {
    this.isLoading = true; this.cdr.detectChanges();
    try { const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc')); const querySnapshot = await getDocs(q); this.allOrders = querySnapshot.docs.map(doc => doc.data() as Order); this.applyFilters(); this.isLoading = false; this.cdr.detectChanges();
    } catch (error) { console.error("Error fetching orders:", error); this.isLoading = false; }
  }

  onSearchInput(value: string) { this.searchText = value; this.searchSubject.next(value); }
  updateFilterStatus(val: string) { this.filterStatus = val; this.applyFilters(); }
  updateFilterMethod(val: string) { this.filterMethod = val; this.applyFilters(); }
  updateFilterLocation(val: string) { this.filterLocation = val; this.applyFilters(); }

  applyFilters() {
    let temp = [...this.allOrders];
    if (this.searchText && this.searchText.trim() !== '') {
        const term = this.searchText.toLowerCase().trim();
        temp = temp.filter(order => (order.id && order.id.toLowerCase().includes(term)) || (order.customer && order.customer.toLowerCase().includes(term)) || (order.status && order.status.toLowerCase().includes(term)) || (order.method && order.method.toLowerCase().includes(term)) || (order.location && order.location.toLowerCase().includes(term)) || (order.amount && order.amount.toString().includes(term)));
    }
    if (this.filterStatus) temp = temp.filter(o => o.status === this.filterStatus);
    if (this.filterMethod) temp = temp.filter(o => o.method === this.filterMethod);
    if (this.filterLocation) temp = temp.filter(o => o.location === this.filterLocation);
    this.filteredOrders = temp; this.totalItems = this.filteredOrders.length; this.currentPage = 1; this.updatePaginatedView();
  }

  updatePaginatedView() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.recentOrders = this.filteredOrders.slice(startIndex, endIndex);
    this.isLastPage = endIndex >= this.totalItems;
    this.cdr.detectChanges();
  }

  onItemsPerPageChange(newSize: number) { this.itemsPerPage = Number(newSize); this.currentPage = 1; this.updatePaginatedView(); }
  handlePageChange(targetPage: number) { if (targetPage < 1) return; const maxPage = Math.ceil(this.totalItems / this.itemsPerPage); if (targetPage > maxPage) targetPage = maxPage; this.currentPage = targetPage; this.updatePaginatedView(); }
  toggleFilters(event?: Event) { if(event) event.stopPropagation(); this.showFilters = !this.showFilters; }
  resetFilters() { this.searchText = ''; this.filterStatus = ''; this.filterMethod = ''; this.filterLocation = ''; this.applyFilters(); }

  async addDummyData() {
    if (!confirm('Add 30 dummy orders?')) return; this.isLoading = true;
    try { const batch = writeBatch(db); const ordersRef = collection(db, 'orders'); const statuses = ['Completed', 'Processing', 'Failed']; const methods = ['Card', 'Cash', 'Online']; const locations = ['New York HQ', 'London Store', 'Online']; const customers = ['John Doe', 'Jane Smith', 'Nexus Corp', 'Alpha Ind', 'Robert Fox', 'Cody Fisher']; for (let i = 1; i <= 30; i++) { const newId = 'ORD-' + Math.floor(1000 + Math.random() * 9000); const date = new Date(); date.setSeconds(date.getSeconds() - i * 1000); const timeString = date.toTimeString().split(' ')[0]; const newDocRef = doc(ordersRef); batch.set(newDocRef, { id: newId, customer: customers[Math.floor(Math.random() * customers.length)], amount: Math.floor(100 + Math.random() * 5000), status: statuses[Math.floor(Math.random() * statuses.length)], method: methods[Math.floor(Math.random() * methods.length)], location: locations[Math.floor(Math.random() * locations.length)], time: timeString, createdAt: date.toISOString() }); } await batch.commit(); alert('Success! 30 Dummy Orders Added.'); this.fetchAllOrders(); } catch (error: any) { alert('Error: ' + error.message); this.isLoading = false; } 
  }

  initBaseChartSettings() { this.mainChartOptions = { chart: { type: "area", height: 280, fontFamily: 'Inter', background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } }, colors: ['#3b82f6'], fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 100] }}, dataLabels: { enabled: false }, stroke: { curve: 'smooth', width: 2 }, yaxis: { labels: { formatter: (val:number) => (val/1000).toFixed(1) + 'k', style: { colors: '#94a3b8' } } }, xaxis: { labels: { style: { colors: '#94a3b8' } } }, grid: { borderColor: this.isDarkMode ? '#334155' : '#f1f5f9', strokeDashArray: 4 }, theme: { mode: this.isDarkMode ? 'dark' : 'light' } }; }
  initDonutChart(data: DashboardData) { this.donutChartOptions = { series: data.channelSales.series, labels: data.channelSales.labels, chart: { type: "donut", height: 250, fontFamily: 'Inter', background: 'transparent' }, colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'], legend: { position: 'right', labels: { colors: '#94a3b8' } }, theme: { mode: this.isDarkMode ? 'dark' : 'light' } }; }
  updateChartFilter(filter?: string) { if(filter) this.selectedChartFilter = filter; this.mainChartOptions = { ...this.mainChartOptions, series: [{ name: "Revenue", data: [12450, 15000, 13800, 18000, 16500, 21000, 19500] }], xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], labels: { style: { colors: '#94a3b8' } } } }; }
  toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; }
  getInitials(name: string) { return name.substring(0, 2).toUpperCase(); }
  toggleTheme(forceDark?: boolean) { this.isDarkMode = forceDark !== undefined ? forceDark : !this.isDarkMode; if (isPlatformBrowser(this.platformId)) { if (this.isDarkMode) document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode'); localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light'); this.initBaseChartSettings(); this.updateChartFilter(); if(this.dashboardData) this.initDonutChart(this.dashboardData); } }
  navigateTo(v: string) { this.currentView = v; if(window.innerWidth<=768) this.isSidebarOpen = false; }
  launchPOS() { this.currentView = 'POS'; }
  
  async fetchManagedUsers() { try { const querySnapshot = await getDocs(collection(db, 'Users')); const usersList: ManagedUser[] = []; querySnapshot.forEach((doc) => { const data = doc.data() as any; let createdStr = 'N/A'; if (data.createdAt && data.createdAt.toDate) { createdStr = data.createdAt.toDate().toLocaleDateString() + ' ' + data.createdAt.toDate().toLocaleTimeString(); } else if (data.createdAt) { createdStr = new Date(data.createdAt).toLocaleString(); } usersList.push({ id: doc.id, name: data.name || 'Unknown', email: data.email || 'No Email', role: data.userRole || 'User', status: data.status || 'Active', createdAt: createdStr }); }); this.managedUsers = usersList; this.cdr.detectChanges(); } catch (error) { console.error('Error fetching users:', error); } }
  async fetchCustomRoles() { try { const querySnapshot = await getDocs(collection(db, 'roles')); const dbRoles: CustomRole[] = []; querySnapshot.forEach((doc) => { const data = doc.data() as any; dbRoles.push({ name: data.name, permissions: data.permissions, isSystemDefault: false }); }); const defaultNames = ['Super Admin', 'Admin', 'Store Admin', 'User']; const existingDefaults = this.availableRoles.filter(r => defaultNames.includes(r.name)); this.availableRoles = [...existingDefaults, ...dbRoles]; this.cdr.detectChanges(); } catch (error) { console.error(error); } }
  async saveCustomRole(eventData: any) { const { data: roleData, onSuccess, onError } = eventData; try { await addDoc(collection(db, 'roles'), { name: roleData.name, permissions: roleData.permissions, createdAt: serverTimestamp() }); this.availableRoles.push({ name: roleData.name, permissions: roleData.permissions, isSystemDefault: false }); if (onSuccess) onSuccess(); } catch (error: any) { if (onError) onError('Failed to save role: ' + error.message); } }
  async submitNewUser(eventData: any) { const { data: newUser, onSuccess, onError } = eventData; let secondaryApp: any = null; try { const config = auth.app.options; secondaryApp = initializeApp(config, 'SecondaryApp'); const secondaryAuth = getAuth(secondaryApp); const userCred = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password); const newUid = userCred.user.uid; await signOut(secondaryAuth); await deleteApp(secondaryApp); secondaryApp = null; await setDoc(doc(db, 'Users', newUid), { uid: newUid, name: newUser.name, email: newUser.email, userRole: newUser.role, role: newUser.role, status: 'Active', createdAt: serverTimestamp(), createdBy: this.currentUser.email || 'Super Admin' }); this.fetchManagedUsers(); if (onSuccess) onSuccess(); } catch (error: any) { if (secondaryApp) await deleteApp(secondaryApp); if (onError) onError('Error creating user: ' + error.message); } }
  async deleteUser(userId: number | string) { if (!this.currentUser.permissions.canDeleteUsers) { alert('ACCESS DENIED'); return; } if(!confirm('Are you sure you want to permanently remove this user?')) return; this.isLoading = true; try { await deleteDoc(doc(db, 'Users', String(userId))); this.managedUsers = this.managedUsers.filter(u => u.id !== userId); alert('User removed successfully.'); } catch (error: any) { alert('Failed to delete: ' + error.message); } finally { this.isLoading = false; this.cdr.detectChanges(); } }
  async fetchInventory() { this.isLoading = true; try { const q = query(collection(db, 'inventory'), orderBy('name', 'asc')); const querySnapshot = await getDocs(q); this.inventoryItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[]; this.cdr.detectChanges(); } catch (error) { console.error("Error fetching inventory:", error); } finally { this.isLoading = false; } }
  async generateDummyInventory() { if(!confirm("⚠️ This will add 15 dummy products to your live database. Proceed?")) return; this.isLoading = true; const batch = writeBatch(db); const inventoryRef = collection(db, 'inventory'); const sampleItems: any[] = [ { name: 'Premium Arabica Beans', sku: 'CF-001', category: 'Raw Material', price: 850, stock: 45, minStock: 20, status: 'In Stock' }, { name: 'Paper Cups (12oz)', sku: 'PKG-102', category: 'Packaging', price: 3.5, stock: 12, minStock: 50, status: 'Low Stock' }, ]; sampleItems.forEach((item) => { const newDocRef = doc(inventoryRef); batch.set(newDocRef, { ...item, lastUpdated: new Date().toISOString().split('T')[0] }); }); try { await batch.commit(); alert("✅ Inventory populated successfully!"); this.fetchInventory(); } catch (error) { console.error("Error generating inventory:", error); } finally { this.isLoading = false; } }
  async onDeleteItem(id: string) { if(!confirm("🗑️ Are you sure you want to delete this product?")) return; try { await deleteDoc(doc(db, 'inventory', id)); this.inventoryItems = this.inventoryItems.filter(i => i.id !== id); alert("Item deleted."); } catch (error: any) { console.error("Delete failed:", error); } }
  onAddItem() { if(confirm("Generate Dummy Data instead of opening modal?")) this.generateDummyInventory(); }
  onEditItem(item: InventoryItem) { alert(`Edit Product: ${item.name} (ID: ${item.id})`); }
}