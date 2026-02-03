import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { NgApexchartsModule } from 'ng-apexcharts';

// 🔥 IMPORT EMAILJS
import emailjs from '@emailjs/browser';

// Services
import { DashboardService } from './dashboard.service'; 
import { FirestoreService } from '../../services/firestore.service'; 

// Models
import { 
  DashboardData, UserProfile, Order, CartItem, Product, ManagedUser, CustomRole, 
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

// Firebase
import { auth, db } from '../../firebase'; 
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  writeBatch, doc, collection, setDoc, serverTimestamp, getDoc, addDoc, 
  getDocs, deleteDoc, query, orderBy
} from 'firebase/firestore';

// 🔥 RxJS for Debouncing
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    SidebarComponent, 
    TopbarComponent, 
    DashboardOverviewComponent, 
    CrmViewComponent, 
    PosTerminalComponent, 
    ReportsViewComponent, 
    UserManagementComponent,
    InventoryManagerComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  // --- CONFIGURATION FOR FREE EMAIL ---
  private emailServiceId = 'YOUR_SERVICE_ID';   
  private emailTemplateId = 'YOUR_TEMPLATE_ID'; 
  private emailPublicKey = 'YOUR_PUBLIC_KEY';   

  // --- DATA STATE ---
  public dashboardData: DashboardData | null = null;
  public currentUser: UserProfile = { 
      name: 'Guest', role: 'User', initials: 'G', email: '', 
      permissions: { canViewDashboard: true, canViewOrders: true, canCreateOrder: true, canManageInventory: true, canViewReports: true, canManageUsers: true, canDeleteUsers: true, canViewCustomers: true, canManageSettings: true, canViewAuditLog: true } 
  };
  
  // --- UI STATE ---
  public currentView: string = 'Dashboard';
  public isSidebarOpen: boolean = true;
  public isDarkMode: boolean = false;
  public isUserLoading: boolean = true;
  public isLoading: boolean = false; 

  // --- FILTERS & PAGINATION ---
  public showFilters: boolean = false; 
  public searchText: string = '';      
  public filterStatus: string = '';    
  public filterMethod: string = '';    
  public filterLocation: string = ''; 
  public selectedChartFilter: string = 'Daily'; 

  // 🔥 Filter Subject for Debouncing
  private searchSubject = new Subject<string>();

  public itemsPerPage: number = 5; 
  public currentPage: number = 1;
  public totalItems: number = 0; 
  public isLastPage: boolean = false;
  
  // --- ORDERS ---
  public allOrders: Order[] = [];       
  public filteredOrders: Order[] = [];  
  public recentOrders: Order[] = [];    
  
  // --- USER MANAGEMENT ---
  public managedUsers: ManagedUser[] = []; 
  public availableRoles: CustomRole[] = [
    { name: 'Super Admin', isSystemDefault: true, permissions: { canViewDashboard: true, canViewOrders: true, canCreateOrder: true, canManageInventory: true, canViewReports: true, canManageUsers: true, canDeleteUsers: true, canViewCustomers: true, canManageSettings: true, canViewAuditLog: true } },
    { name: 'Admin', isSystemDefault: true, permissions: { canViewDashboard: true, canViewOrders: true, canCreateOrder: true, canManageInventory: true, canViewReports: true, canManageUsers: true, canDeleteUsers: false, canViewCustomers: true, canManageSettings: false, canViewAuditLog: true } },
    { name: 'User', isSystemDefault: true, permissions: { canViewDashboard: true, canViewOrders: true, canCreateOrder: true, canManageInventory: false, canViewReports: false, canManageUsers: false, canDeleteUsers: false, canViewCustomers: false, canManageSettings: false, canViewAuditLog: false } }
  ];

  // --- CRM & DUMMY DATA ---
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
  
  // --- POS DATA ---
  public posProducts: Product[] = [
    { id: 1, name: 'Espresso', price: 150, color: '#fca5a5', icon: '☕' },
    { id: 2, name: 'Cappuccino', price: 220, color: '#fdba74', icon: '🥛' },
    { id: 3, name: 'Latte', price: 200, color: '#fcd34d', icon: '🧊' },
    { id: 4, name: 'Mocha', price: 240, color: '#bef264', icon: '🍫' },
    { id: 5, name: 'Croissant', price: 120, color: '#86efac', icon: '🥐' },
    { id: 6, name: 'Bagel', price: 100, color: '#67e8f9', icon: '🥯' },
    { id: 7, name: 'Sandwich', price: 350, color: '#93c5fd', icon: '🥪' },
    { id: 8, name: 'Salad', price: 280, color: '#c4b5fd', icon: '🥗' },
    { id: 9, name: 'Tea', price: 80, color: '#f9a8d4', icon: '🍵' },
    { id: 10, name: 'Water', price: 40, color: '#fda4af', icon: '💧' },
  ];
  public cart: CartItem[] = [];

  public inventoryItems: InventoryItem[] = [];

  // --- CHARTS ---
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
            this.currentUser = JSON.parse(cachedUser);
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

    // 🔥 SEARCH DEBOUNCE LOGIC
    this.searchSubject.pipe(
        debounceTime(300), 
        distinctUntilChanged()
    ).subscribe(() => {
        this.applyFilters();
    });

    this.dashboardService.getDashboardMetrics().subscribe((data: DashboardData) => {
      this.dashboardData = data;
      this.reportKpis = data.kpis;
      this.salesStats = data.salesStats || [];
      this.orderSummary = data.orderSummary || [];
      this.inventoryStatus = data.inventoryStatus || [];
      
      this.initBaseChartSettings();
      this.updateChartFilter(); 
      this.initDonutChart(data);
    });

    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') this.toggleTheme(true);
    }
  }

  loadCurrentUser() {
    if (isPlatformBrowser(this.platformId)) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const userRole = userData['role'] || 'User';
                    this.currentUser = { 
                        name: userData['name'] || 'User', 
                        role: userRole, 
                        initials: this.getInitials(userData['name'] || 'User'), 
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
            this.isUserLoading = false;
            this.cdr.detectChanges();
        });
    }
  }

  logout() { 
    if (isPlatformBrowser(this.platformId)) {
      if (confirm('Secure Logout: Are you sure?')) {
        signOut(auth).then(() => {
            localStorage.removeItem('user_profile'); localStorage.removeItem('authUser'); sessionStorage.clear();
            this.router.navigate(['/login']);
        });
      }
    }
  }

  // --- DATA FETCHING ---
  async fetchAllOrders() {
    this.isLoading = true;
    this.cdr.detectChanges();
    try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        this.allOrders = querySnapshot.docs.map(doc => doc.data() as Order);
        this.applyFilters(); // Initial filter apply
        this.isLoading = false;
        this.cdr.detectChanges();
    } catch (error) {
        console.error("Error fetching orders:", error);
        this.isLoading = false;
    }
  }

  // --- 🔥 NEW: FILTERS & SEARCH LOGIC ---
  
  // 1. Triggered by Search Input (Debounced)
  onSearchInput(value: string) {
    this.searchText = value;
    this.searchSubject.next(value);
  }

  // 2. Triggered by Dropdowns (Immediate)
  updateFilterStatus(val: string) { this.filterStatus = val; this.applyFilters(); }
  updateFilterMethod(val: string) { this.filterMethod = val; this.applyFilters(); }
  updateFilterLocation(val: string) { this.filterLocation = val; this.applyFilters(); }

  // 3. Main Logic
  applyFilters() {
    let temp = [...this.allOrders];

    // Search Logic (All Parameters)
    if (this.searchText && this.searchText.trim() !== '') {
        const term = this.searchText.toLowerCase().trim();
        temp = temp.filter(order => 
            (order.id && order.id.toLowerCase().includes(term)) ||
            (order.customer && order.customer.toLowerCase().includes(term)) ||
            (order.status && order.status.toLowerCase().includes(term)) ||
            (order.method && order.method.toLowerCase().includes(term)) ||
            (order.location && order.location.toLowerCase().includes(term)) ||
            (order.amount && order.amount.toString().includes(term))
        );
    }

    // Dropdown Logic (AND Condition)
    if (this.filterStatus) temp = temp.filter(o => o.status === this.filterStatus);
    if (this.filterMethod) temp = temp.filter(o => o.method === this.filterMethod);
    if (this.filterLocation) temp = temp.filter(o => o.location === this.filterLocation);

    this.filteredOrders = temp;
    this.totalItems = this.filteredOrders.length;
    this.currentPage = 1; // Reset to page 1 on filter change
    this.updatePaginatedView();
  }

  updatePaginatedView() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.recentOrders = this.filteredOrders.slice(startIndex, endIndex);
    this.isLastPage = endIndex >= this.totalItems;
    this.cdr.detectChanges();
  }

  onItemsPerPageChange(newSize: number) {
      this.itemsPerPage = Number(newSize);
      this.currentPage = 1;
      this.updatePaginatedView();
  }

  handlePageChange(targetPage: number) {
      if (targetPage < 1) return;
      const maxPage = Math.ceil(this.totalItems / this.itemsPerPage);
      if (targetPage > maxPage) targetPage = maxPage;
      this.currentPage = targetPage;
      this.updatePaginatedView();
  }

  toggleFilters(event?: Event) { if(event) event.stopPropagation(); this.showFilters = !this.showFilters; }
  
  resetFilters() { 
      this.searchText = ''; 
      this.filterStatus = ''; 
      this.filterMethod = ''; 
      this.filterLocation = ''; 
      this.applyFilters();
  }

  // --- DUMMY DATA ---
  async addDummyData() {
    if (!confirm('Add 30 dummy orders?')) return;
    this.isLoading = true;
    try {
      const batch = writeBatch(db);
      const ordersRef = collection(db, 'orders'); 
      const statuses = ['Completed', 'Processing', 'Failed'];
      const methods = ['Card', 'Cash', 'Online'];
      const locations = ['New York HQ', 'London Store', 'Online'];
      const customers = ['John Doe', 'Jane Smith', 'Nexus Corp', 'Alpha Ind', 'Robert Fox', 'Cody Fisher'];
      
      for (let i = 1; i <= 30; i++) {
        const newId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
        const date = new Date();
        date.setSeconds(date.getSeconds() - i * 1000);
        const timeString = date.toTimeString().split(' ')[0]; 
        const newDocRef = doc(ordersRef); 
        batch.set(newDocRef, {
          id: newId, 
          customer: customers[Math.floor(Math.random() * customers.length)], 
          amount: Math.floor(100 + Math.random() * 5000),
          status: statuses[Math.floor(Math.random() * statuses.length)], 
          method: methods[Math.floor(Math.random() * methods.length)],
          location: locations[Math.floor(Math.random() * locations.length)], 
          time: timeString, 
          createdAt: date.toISOString()
        });
      }
      await batch.commit();
      alert('Success! 30 Dummy Orders Added.');
      this.fetchAllOrders(); 
    } catch (error: any) { alert('Error: ' + error.message); this.isLoading = false; } 
  }

  // --- CHART LOGIC ---
  initBaseChartSettings() {
     this.mainChartOptions = {
      chart: { type: "area", height: 280, fontFamily: 'Inter', background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
      colors: ['#3b82f6'],
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 100] }},
      dataLabels: { enabled: false }, 
      stroke: { curve: 'smooth', width: 2 },
      yaxis: { labels: { formatter: (val:number) => (val/1000).toFixed(1) + 'k', style: { colors: '#94a3b8' } } },
      xaxis: { labels: { style: { colors: '#94a3b8' } } },
      grid: { borderColor: this.isDarkMode ? '#334155' : '#f1f5f9', strokeDashArray: 4 },
      theme: { mode: this.isDarkMode ? 'dark' : 'light' }
    };
  }

  initDonutChart(data: DashboardData) {
    this.donutChartOptions = {
      series: data.channelSales.series, 
      labels: data.channelSales.labels,
      chart: { type: "donut", height: 250, fontFamily: 'Inter', background: 'transparent' },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      legend: { position: 'right', labels: { colors: '#94a3b8' } },
      theme: { mode: this.isDarkMode ? 'dark' : 'light' }
    };
  }

  updateChartFilter(filter?: string) {
    if(filter) this.selectedChartFilter = filter;
    this.mainChartOptions = { 
        ...this.mainChartOptions, 
        series: [{ name: "Revenue", data: [12450, 15000, 13800, 18000, 16500, 21000, 19500] }], 
        xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], labels: { style: { colors: '#94a3b8' } } }
    };
  }

  // --- THEME & NAV LOGIC ---
  toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; }
  getInitials(name: string) { return name.substring(0, 2).toUpperCase(); }
  getPermissionsForRole(role: string) { return this.availableRoles.find(r => r.name === role)?.permissions || ({} as any); }
  
  toggleTheme(forceDark?: boolean) {
    this.isDarkMode = forceDark !== undefined ? forceDark : !this.isDarkMode;
    if (isPlatformBrowser(this.platformId)) {
      if (this.isDarkMode) document.body.classList.add('dark-mode');
      else document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
      this.initBaseChartSettings();
      this.updateChartFilter();
      if(this.dashboardData) this.initDonutChart(this.dashboardData);
    }
  }

  navigateTo(v: string) { this.currentView = v; if(window.innerWidth<=768) this.isSidebarOpen = false; }
  launchPOS() { this.currentView = 'POS'; }
  
  addToCart(product: Product) { 
    const existingItem = this.cart.find(item => item.id === product.id);
    if (existingItem) existingItem.quantity += 1; else this.cart.push({ ...product, quantity: 1 });
    this.cart = [...this.cart];
    this.cdr.detectChanges();
  }

  removeFromCart(item: CartItem) { 
    const index = this.cart.indexOf(item); 
    if (index > -1) { this.cart.splice(index, 1); this.cart = [...this.cart]; this.cdr.detectChanges(); }
  }

  clearCart() { this.cart = []; this.cdr.detectChanges(); }
  get cartTotal(): number { return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0); }

  processCheckout() { 
    if(this.cart.length > 0) { alert(`Payment of ₹${this.cartTotal} Successful!`); this.cart = []; this.cdr.detectChanges(); } else { alert('Cart is empty!'); }
  }
  
  // --- USER MANAGEMENT LOGIC ---
  async fetchManagedUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList: ManagedUser[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as any;
            if (data.email !== this.currentUser.email) {
                usersList.push({ id: data.uid || doc.id, name: data.name || 'Unknown', email: data.email || 'No Email', role: data.role || 'User', status: data.status || 'Active' });
            }
        });
        this.managedUsers = usersList;
        this.cdr.detectChanges();
    } catch (error) { console.error(error); }
  }

  async fetchCustomRoles() {
    try {
        const querySnapshot = await getDocs(collection(db, 'roles'));
        const dbRoles: CustomRole[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as any;
            dbRoles.push({ name: data.name, permissions: data.permissions, isSystemDefault: false });
        });
        const defaultNames = ['Super Admin', 'Admin', 'User'];
        const existingDefaults = this.availableRoles.filter(r => defaultNames.includes(r.name));
        this.availableRoles = [...existingDefaults, ...dbRoles];
        this.cdr.detectChanges();
    } catch (error) { console.error(error); }
  }

  async saveCustomRole(eventData: any) {
    const { data: roleData, onSuccess, onError } = eventData;
    try {
        await addDoc(collection(db, 'roles'), { name: roleData.name, permissions: roleData.permissions, createdAt: serverTimestamp() });
        this.availableRoles.push({ name: roleData.name, permissions: roleData.permissions, isSystemDefault: false });
        if (onSuccess) onSuccess();
    } catch (error: any) { if (onError) onError('Failed to save role: ' + error.message); }
  }

  async submitNewUser(eventData: any) {
    const { data: newUser, onSuccess, onError } = eventData; 
    try {
        const newUid = 'USER-' + Date.now(); 
        await setDoc(doc(db, 'users', newUid), {
            uid: newUid, name: newUser.name, email: newUser.email, role: newUser.role, status: 'Active', createdAt: serverTimestamp(), createdBy: this.currentUser.email || 'Super Admin'
        });

        const templateParams = { name: newUser.name, email: newUser.email, role: newUser.role };
        emailjs.send(this.emailServiceId, this.emailTemplateId, templateParams, this.emailPublicKey)
            .then((response) => console.log('EMAIL SUCCESS!', response.status), (err) => console.log('EMAIL FAILED...', err));

        this.fetchManagedUsers(); 
        if (onSuccess) onSuccess(); 
    } catch (error: any) { if (onError) onError('Error creating user: ' + error.message); }
  }

  async deleteUser(userId: number | string) {
      if (!this.currentUser.permissions.canDeleteUsers) { alert('ACCESS DENIED'); return; }
      if(!confirm('Are you sure you want to permanently remove this user?')) return;
      this.isLoading = true; 
      try {
          await deleteDoc(doc(db, 'users', String(userId)));
          this.managedUsers = this.managedUsers.filter(u => u.id !== userId);
          alert('User removed successfully.');
      } catch (error: any) { alert('Failed to delete: ' + error.message); } 
      finally { this.isLoading = false; this.cdr.detectChanges(); }
  }

  async fetchInventory() {
    this.isLoading = true;
    try {
      const q = query(collection(db, 'inventory'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      this.inventoryItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
      this.cdr.detectChanges();
    } catch (error) { console.error("Error fetching inventory:", error); } finally { this.isLoading = false; }
  }

  async generateDummyInventory() {
    if(!confirm("⚠️ This will add 15 dummy products to your live database. Proceed?")) return;
    this.isLoading = true;
    const batch = writeBatch(db);
    const inventoryRef = collection(db, 'inventory');
    const sampleItems: any[] = [
      { name: 'Premium Arabica Beans', sku: 'CF-001', category: 'Raw Material', price: 850, stock: 45, minStock: 20, status: 'In Stock' },
      // ... (Rest of dummy data kept same as your code)
    ];
    sampleItems.forEach((item) => { const newDocRef = doc(inventoryRef); batch.set(newDocRef, { ...item, lastUpdated: new Date().toISOString().split('T')[0] }); });
    try { await batch.commit(); alert("✅ Inventory populated successfully!"); this.fetchInventory(); } catch (error) { console.error("Error generating inventory:", error); } finally { this.isLoading = false; }
  }

  async onDeleteItem(id: string) {
    if(!confirm("🗑️ Are you sure you want to delete this product?")) return;
    try { await deleteDoc(doc(db, 'inventory', id)); this.inventoryItems = this.inventoryItems.filter(i => i.id !== id); alert("Item deleted."); } catch (error: any) { console.error("Delete failed:", error); }
  }

  onAddItem() { if(confirm("Generate Dummy Data instead of opening modal?")) this.generateDummyInventory(); }
  onEditItem(item: InventoryItem) { alert(`Edit Product: ${item.name} (ID: ${item.id})`); }
}