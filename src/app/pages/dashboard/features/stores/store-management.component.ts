import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '../../core/dashboard.model';
import { db } from '../../../../firebase'; 
import { collection, query, getDocs, getCountFromServer, doc, limit, where, orderBy, getDoc, setDoc, serverTimestamp, updateDoc, addDoc } from 'firebase/firestore';

@Component({
  selector: 'app-store-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './store-management.component.html',
  styleUrls: ['./store-management.component.css']
})
export class StoreManagementComponent implements OnInit {
  
  @Input() isDarkMode: boolean = false;

  public stores: Store[] = [];
  public selectedStore: Store | null = null;
  public searchText: string = '';
  public isLoading: boolean = false;
  
  // 🔥 UPDATED View Modes to include MASTER_CATALOG
  public viewMode: 'LIST' | 'DETAILS' | 'SUBVIEW' | 'ORDER_DETAIL' | 'MENU_ITEM_DETAIL' | 'CUSTOMER_HISTORY' | 'PURCHASE_ORDER_DETAIL' | 'SUPPLIER_DETAIL' | 'RAW_MATERIAL_DETAIL' | 'TABLE_DETAIL' | 'MODIFIER_DETAIL' | 'SETTINGS' | 'BILLING' | 'AUDIT_LOGS' | 'MASTER_CATALOG' = 'LIST';
  
  public activeSubView: string = ''; 
  public subViewData: any[] = [];
  public isSubLoading: boolean = false;

  public isCreateStoreModalOpen: boolean = false;
  public isCreatingStore: boolean = false;
  public newStoreData = { name: '', location: '', manager: '', phone: '', plan: '1 Month' };

  public selectedOrder: any = null;
  public selectedMenuItem: any = null;
  public selectedCustomer: any = null;
  public selectedPurchaseOrder: any = null;
  public selectedSupplier: any = null;
  public selectedRawMaterial: any = null;
  public selectedTable: any = null;
  public selectedModifier: any = null;
  
  public storeSettings: any = null;
  public isSettingsLoading: boolean = false;
  public isSavingSettings: boolean = false;
  
  // Billing State
  public billingHistory: any[] = [];
  public isBillingLoading: boolean = false;
  public availablePlans = [
      { name: 'Free', price: 0, duration: 'Forever', features: ['Basic Reporting', '100 Orders/mo'] },
      { name: 'Starter', price: 999, duration: 'Monthly', features: ['Standard Reporting', '1000 Orders/mo', 'Email Support'] },
      { name: 'Pro', price: 2499, duration: 'Monthly', features: ['Advanced Analytics', 'Unlimited Orders', 'Priority Support', 'Inventory Mgmt'] },
      { name: 'Enterprise', price: 9999, duration: 'Yearly', features: ['Custom Features', 'Dedicated Manager', 'API Access'] }
  ];

  // Audit Log State
  public auditLogs: any[] = [];
  public isLogsLoading: boolean = false;

  // 🔥 Master Catalog State
  public masterItems: any[] = [];
  public isCatalogLoading: boolean = false;
  public isAddItemModalOpen: boolean = false;
  public isPushModalOpen: boolean = false;
  public newItemData = { name: '', category: 'Beverages', price: 0, type: 'veg' };
  public selectedMasterItem: any = null;
  public selectedStoreIds: Set<string> = new Set();
  
  public customerOrders: any[] = [];
  public supplierPurchaseOrders: any[] = [];
  public rawMaterialSuppliers: any[] = [];
  public tableLiveOrder: any = null;

  public storeStats = {
    customers: 0, orders: 0, menuItems: 0, menuCategories: 0, modifiers: 0,
    purchaseOrders: 0, rawMaterials: 0, suppliers: 0, tables: 0,
    loading: false
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() { 
      this.fetchStores(); 
  }

  // HELPER: Centralized Audit Logging
  async logAction(action: string, target: string, details: string) {
    try {
        const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        const username = userProfile.name || 'Unknown User';
        
        await addDoc(collection(db, 'SystemLogs'), {
            action: action,
            target: target,
            details: details,
            performedBy: username,
            timestamp: serverTimestamp()
        });
    } catch (e) { console.error("Failed to log audit event", e); }
  }

  // ACTION: Fetch Audit Logs
  async openAuditLogs() {
    this.viewMode = 'AUDIT_LOGS';
    this.isLogsLoading = true;
    this.cdr.detectChanges();
    try {
        const q = query(collection(db, 'SystemLogs'), orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        this.auditLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) { console.error("Error fetching logs:", error); }
    finally { this.isLogsLoading = false; this.cdr.detectChanges(); }
  }

  // 🔥 NEW: Master Catalog Logic
  async openMasterCatalog() {
    this.viewMode = 'MASTER_CATALOG';
    this.fetchMasterCatalog();
  }

  async fetchMasterCatalog() {
    this.isCatalogLoading = true;
    this.cdr.detectChanges();
    try {
        const q = query(collection(db, 'MasterCatalog'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        this.masterItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) { console.error("Error fetching catalog:", error); }
    finally { this.isCatalogLoading = false; this.cdr.detectChanges(); }
  }

  openAddItemModal() {
    this.newItemData = { name: '', category: 'Beverages', price: 0, type: 'veg' };
    this.isAddItemModalOpen = true;
  }

  closeAddItemModal() { this.isAddItemModalOpen = false; }

  async saveMasterItem() {
    if (!this.newItemData.name || this.newItemData.price < 0) return;
    this.isCatalogLoading = true;
    try {
        await addDoc(collection(db, 'MasterCatalog'), {
            ...this.newItemData,
            createdAt: serverTimestamp(),
            isActive: true
        });
        this.logAction('Create Master Item', 'Master Catalog', `Added item: ${this.newItemData.name}`);
        this.closeAddItemModal();
        this.fetchMasterCatalog();
    } catch (error) { console.error(error); alert('Failed to save item'); }
    finally { this.isCatalogLoading = false; this.cdr.detectChanges(); }
  }

  openPushModal(item: any) {
    this.selectedMasterItem = item;
    this.selectedStoreIds.clear();
    this.isPushModalOpen = true;
  }

  closePushModal() {
    this.isPushModalOpen = false;
    this.selectedMasterItem = null;
  }

  toggleStoreSelection(storeId: string) {
    if (this.selectedStoreIds.has(storeId)) {
        this.selectedStoreIds.delete(storeId);
    } else {
        this.selectedStoreIds.add(storeId);
    }
  }

  async pushItemToSelectedStores() {
    if (this.selectedStoreIds.size === 0 || !this.selectedMasterItem) return;
    
    if(!confirm(`Are you sure you want to push "${this.selectedMasterItem.name}" to ${this.selectedStoreIds.size} stores?`)) return;

    this.isCatalogLoading = true;
    this.cdr.detectChanges();

    try {
        const promises = Array.from(this.selectedStoreIds).map(storeId => {
            return addDoc(collection(db, 'Stores', storeId, 'menuItems'), {
                name: this.selectedMasterItem.name,
                category: this.selectedMasterItem.category,
                price: this.selectedMasterItem.price,
                type: this.selectedMasterItem.type,
                isVeg: this.selectedMasterItem.type === 'veg',
                isActive: true,
                imageUrl: '', // Optional
                pushedFromMaster: true,
                createdAt: serverTimestamp()
            });
        });

        await Promise.all(promises);
        this.logAction('Push Catalog Item', 'Multiple Stores', `Pushed ${this.selectedMasterItem.name} to ${this.selectedStoreIds.size} stores.`);
        
        alert(`Successfully pushed to ${this.selectedStoreIds.size} stores!`);
        this.closePushModal();
    } catch (error) {
        console.error("Push failed:", error);
        alert('Some items failed to push. Check logs.');
    } finally {
        this.isCatalogLoading = false;
        this.cdr.detectChanges();
    }
  }

  async fetchStores() {
    this.isLoading = true;
    this.cdr.detectChanges(); 
    try {
        const q = query(collection(db, 'Stores')); 
        const querySnapshot = await getDocs(q);
        this.stores = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const safeName = data['name'] && data['name'].trim() !== '' ? data['name'] : `(No Name) - ${doc.id.substring(0, 6)}...`;
            return { 
                id: doc.id, name: safeName, location: data['location'] || 'N/A', manager: data['manager'] || 'Admin', 
                contact: data['phone'] || 'N/A', status: data['isActive'] ? 'Open' : 'Closed', plan: data['plan'] || 'Free',
                licenseKey: data['licenseKey'] || 'No License', slug: data['slug'] || 'n/a',
                updatedAt: this.formatDate(data['updatedAt']), revenue: data['revenue'] || 0
            } as Store;
        });
        this.cdr.detectChanges(); 
    } catch (error: any) { console.error("Error fetching stores:", error); } finally { this.isLoading = false; this.cdr.detectChanges(); }
  }

  openCreateStoreModal() { this.newStoreData = { name: '', location: '', manager: '', phone: '', plan: '1 Month' }; this.isCreateStoreModalOpen = true; }
  closeCreateStoreModal() { this.isCreateStoreModalOpen = false; }

  async createStore() {
      if (!this.newStoreData.name.trim()) { alert('Store Name is required!'); return; }
      this.isCreatingStore = true;
      this.cdr.detectChanges();
      try {
          const slug = this.newStoreData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
          const newStoreRef = doc(db, 'Stores', slug); 
          const storePayload = {
              name: this.newStoreData.name, location: this.newStoreData.location || 'N/A', manager: this.newStoreData.manager || 'Admin',
              phone: this.newStoreData.phone || '', plan: this.newStoreData.plan, isActive: true, slug: slug, revenue: 0,
              licenseKey: 'PENDING-' + Date.now().toString().slice(-6), createdAt: serverTimestamp(), updatedAt: serverTimestamp()
          };
          await setDoc(newStoreRef, storePayload);
          const settingsRef = doc(db, 'Stores', newStoreRef.id, 'settings', 'customisation');
          await setDoc(settingsRef, {
              name: this.newStoreData.name, phone: this.newStoreData.phone, taxName: 'GST', taxPercentage: 5, taxInclusive: false,
              enableDineIn: true, enableTakeaway: true, enableDelivery: false, receiptHeader: 'Welcome to ' + this.newStoreData.name,
              receiptFooter: 'Thank you for visiting!', themeColor: '#2563eb', accentColor: '#f59e0b', darkMode: false, showLogoOnReceipt: true
          });
          
          this.logAction('Create Store', this.newStoreData.name, `Created new store with plan ${this.newStoreData.plan}`);

          alert('Store created successfully!');
          this.closeCreateStoreModal();
          this.fetchStores();
      } catch (error: any) { console.error("Error creating store:", error); alert('Failed to create store: ' + error.message); } finally { this.isCreatingStore = false; this.cdr.detectChanges(); }
  }

  async fetchStoreStats(storeId: string) {
    this.storeStats.loading = true;
    this.cdr.detectChanges();
    try {
        const storeRef = doc(db, 'Stores', storeId);
        const [cust, cat, menu, mod, ord, purch, raw, supp, tbl] = await Promise.all([
            getCountFromServer(collection(storeRef, 'customers')), getCountFromServer(collection(storeRef, 'menuCategories')),
            getCountFromServer(collection(storeRef, 'menuItems')), getCountFromServer(collection(storeRef, 'modifiers')),
            getCountFromServer(collection(storeRef, 'orders')), getCountFromServer(collection(storeRef, 'purchaseOrders')),
            getCountFromServer(collection(storeRef, 'rawMaterials')), getCountFromServer(collection(storeRef, 'suppliers')),
            getCountFromServer(collection(storeRef, 'tables'))
        ]);
        this.storeStats = {
            customers: cust.data().count, menuCategories: cat.data().count, menuItems: menu.data().count, modifiers: mod.data().count,
            orders: ord.data().count, purchaseOrders: purch.data().count, rawMaterials: raw.data().count, suppliers: supp.data().count,
            tables: tbl.data().count, loading: false
        };
    } catch (error) { this.storeStats.loading = false; } finally { this.cdr.detectChanges(); }
  }

  async openSubView(collectionName: string) {
    if (!this.selectedStore) return;
    this.viewMode = 'SUBVIEW';
    this.activeSubView = collectionName;
    this.subViewData = [];
    this.isSubLoading = true;
    this.cdr.detectChanges();
    try {
        const subColRef = collection(db, 'Stores', this.selectedStore.id, collectionName);
        const q = query(subColRef, limit(100)); 
        const snapshot = await getDocs(q);
        this.subViewData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) { alert(`Error: ${error.message}`); } finally { this.isSubLoading = false; this.cdr.detectChanges(); }
  }

  viewOrder(order: any) { this.selectedOrder = order; this.viewMode = 'ORDER_DETAIL'; this.cdr.detectChanges(); }
  backToOrders() { this.selectedOrder = null; this.viewMode = 'SUBVIEW'; this.cdr.detectChanges(); }
  viewMenuItem(item: any) { this.selectedMenuItem = item; this.viewMode = 'MENU_ITEM_DETAIL'; this.cdr.detectChanges(); }
  backToMenuItems() { this.selectedMenuItem = null; this.viewMode = 'SUBVIEW'; this.cdr.detectChanges(); }
  viewPurchaseOrder(po: any) { this.selectedPurchaseOrder = po; this.viewMode = 'PURCHASE_ORDER_DETAIL'; this.cdr.detectChanges(); }
  backToPurchaseOrders() { this.selectedPurchaseOrder = null; this.viewMode = 'SUBVIEW'; this.cdr.detectChanges(); }

  async viewCustomerHistory(customer: any) {
      if (!this.selectedStore || !customer.mobile) return;
      this.selectedCustomer = customer;
      this.viewMode = 'CUSTOMER_HISTORY';
      this.customerOrders = [];
      this.isSubLoading = true;
      this.cdr.detectChanges();
      try {
          const ordersRef = collection(db, 'Stores', this.selectedStore.id, 'orders');
          const q = query(ordersRef, where('customerMobile', '==', customer.mobile), orderBy('createdAt', 'desc')); 
          const snapshot = await getDocs(q);
          this.customerOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error: any) {
          if(error.code === 'failed-precondition') {
             const allOrdersQ = query(collection(db, 'Stores', this.selectedStore.id, 'orders'), limit(500));
             const allSnap = await getDocs(allOrdersQ);
             this.customerOrders = allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((o: any) => o.customerMobile === customer.mobile);
          }
      } finally { this.isSubLoading = false; this.cdr.detectChanges(); }
  }
  backToCustomers() { this.selectedCustomer = null; this.activeSubView = 'customers'; this.viewMode = 'SUBVIEW'; this.cdr.detectChanges(); }

  async viewSupplier(supplier: any) {
      if (!this.selectedStore) return;
      this.selectedSupplier = supplier;
      this.viewMode = 'SUPPLIER_DETAIL';
      this.supplierPurchaseOrders = [];
      this.isSubLoading = true;
      this.cdr.detectChanges();
      try {
          const poRef = collection(db, 'Stores', this.selectedStore.id, 'purchaseOrders');
          const q = query(poRef, where('supplierId', '==', supplier.id), orderBy('poDate', 'desc'));
          const snapshot = await getDocs(q);
          this.supplierPurchaseOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error: any) {
          if(error.code === 'failed-precondition') {
             const allQ = query(collection(db, 'Stores', this.selectedStore.id, 'purchaseOrders'), limit(500));
             const allSnap = await getDocs(allQ);
             this.supplierPurchaseOrders = allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((p: any) => p.supplierId === supplier.id);
          }
      } finally { this.isSubLoading = false; this.cdr.detectChanges(); }
  }
  backToSuppliers() { this.selectedSupplier = null; this.activeSubView = 'suppliers'; this.viewMode = 'SUBVIEW'; this.cdr.detectChanges(); }

  async viewRawMaterial(material: any) {
      if (!this.selectedStore) return;
      this.selectedRawMaterial = material;
      this.viewMode = 'RAW_MATERIAL_DETAIL';
      this.rawMaterialSuppliers = [];
      this.isSubLoading = true;
      this.cdr.detectChanges();
      try {
          if (material.suppliers && material.suppliers.length > 0) {
              const supplierPromises = material.suppliers.map((sid: string) => getDoc(doc(db, 'Stores', this.selectedStore!.id, 'suppliers', sid)));
              const supplierDocs = await Promise.all(supplierPromises);
              this.rawMaterialSuppliers = supplierDocs.filter(doc => doc.exists()).map(doc => ({ id: doc.id, ...doc.data() }));
          }
      } catch (error: any) { console.error("Error fetching linked suppliers:", error); } finally { this.isSubLoading = false; this.cdr.detectChanges(); }
  }
  backToRawMaterials() { this.selectedRawMaterial = null; this.activeSubView = 'rawMaterials'; this.viewMode = 'SUBVIEW'; this.cdr.detectChanges(); }

  async viewTable(table: any) {
      if (!this.selectedStore) return;
      this.selectedTable = table;
      this.viewMode = 'TABLE_DETAIL';
      this.tableLiveOrder = null;
      this.isSubLoading = true;
      this.cdr.detectChanges();
      try {
          if (table.isOccupied && table.orderId) {
              const orderDoc = await getDoc(doc(db, 'Stores', this.selectedStore.id, 'orders', table.orderId));
              if (orderDoc.exists()) {
                  this.tableLiveOrder = { id: orderDoc.id, ...orderDoc.data() };
              }
          }
      } catch (error: any) { console.error("Error fetching table order:", error); } finally { this.isSubLoading = false; this.cdr.detectChanges(); }
  }
  backToTables() { this.selectedTable = null; this.activeSubView = 'tables'; this.viewMode = 'SUBVIEW'; this.cdr.detectChanges(); }

  viewModifier(modifier: any) { this.selectedModifier = modifier; this.viewMode = 'MODIFIER_DETAIL'; this.cdr.detectChanges(); }
  backToModifiers() { this.selectedModifier = null; this.activeSubView = 'modifiers'; this.viewMode = 'SUBVIEW'; this.cdr.detectChanges(); }

  async openSettings() {
      if (!this.selectedStore) return;
      this.viewMode = 'SETTINGS';
      this.isSettingsLoading = true;
      this.cdr.detectChanges();
      try {
          const settingsRef = doc(db, 'Stores', this.selectedStore.id, 'settings', 'customisation');
          const settingsSnap = await getDoc(settingsRef);
          const storeRef = doc(db, 'Stores', this.selectedStore.id);
          const storeSnap = await getDoc(storeRef);
          let configData = {};
          if (settingsSnap.exists()) configData = settingsSnap.data();
          else configData = { accentColor: '#f59e0b', darkMode: false, enableDelivery: true, enableDineIn: true, enableTakeaway: true, receiptFooter: 'Visit again soon!', receiptHeader: 'Thank you for visiting!', showLogoOnReceipt: true, taxInclusive: false, taxName: 'GST', taxPercentage: 5, themeColor: '#2563eb' };
          this.storeSettings = { ...configData, isStoreOpen: storeSnap.exists() ? storeSnap.data()['isActive'] : true, enableOrdering: storeSnap.exists() ? (storeSnap.data()['enableOrdering'] !== false) : true };
      } catch (error) { console.error("Error loading settings:", error); } finally { this.isSettingsLoading = false; this.cdr.detectChanges(); }
  }

  onStoreStatusToggle() {
      if (this.storeSettings.isStoreOpen) {
          this.storeSettings.enableOrdering = true;
          this.storeSettings.enableDineIn = true;
          this.storeSettings.enableTakeaway = true;
          this.storeSettings.enableDelivery = true;
      } else {
          this.storeSettings.enableOrdering = false;
          this.storeSettings.enableDineIn = false;
          this.storeSettings.enableTakeaway = false;
          this.storeSettings.enableDelivery = false;
      }
      this.cdr.detectChanges();
  }

  onOrderingToggle() {
      if (!this.storeSettings.enableOrdering) {
          this.storeSettings.enableDineIn = false;
          this.storeSettings.enableTakeaway = false;
          this.storeSettings.enableDelivery = false;
      }
      this.cdr.detectChanges();
  }

  async saveSettings() {
      if (!this.selectedStore || !this.storeSettings) return;
      this.isSavingSettings = true;
      this.cdr.detectChanges();
      try {
          const settingsRef = doc(db, 'Stores', this.selectedStore.id, 'settings', 'customisation');
          const settingsPayload = { receiptHeader: this.storeSettings.receiptHeader, receiptFooter: this.storeSettings.receiptFooter, showLogoOnReceipt: this.storeSettings.showLogoOnReceipt, themeColor: this.storeSettings.themeColor, accentColor: this.storeSettings.accentColor, darkMode: this.storeSettings.darkMode, enableDineIn: this.storeSettings.enableDineIn, enableTakeaway: this.storeSettings.enableTakeaway, enableDelivery: this.storeSettings.enableDelivery, taxName: this.storeSettings.taxName, taxPercentage: this.storeSettings.taxPercentage, taxInclusive: this.storeSettings.taxInclusive };
          await setDoc(settingsRef, settingsPayload, { merge: true });
          const storeRef = doc(db, 'Stores', this.selectedStore.id);
          await updateDoc(storeRef, { isActive: this.storeSettings.isStoreOpen, enableOrdering: this.storeSettings.enableOrdering });
          const storeIndex = this.stores.findIndex(s => s.id === this.selectedStore!.id);
          if (storeIndex !== -1) { this.stores[storeIndex].status = this.storeSettings.isStoreOpen ? 'Open' : 'Closed'; this.selectedStore.status = this.storeSettings.isStoreOpen ? 'Open' : 'Closed'; }
          
          this.logAction('Update Settings', this.selectedStore.name, 'Updated store configuration and operational status.');

          alert('Settings & Store Status saved successfully!');
      } catch (error) { console.error("Error saving settings:", error); alert('Failed to save settings.'); } 
      finally { this.isSavingSettings = false; this.cdr.detectChanges(); }
  }

  // BILLING MANAGEMENT LOGIC
  async openBilling() {
    if (!this.selectedStore) return;
    this.viewMode = 'BILLING';
    this.isBillingLoading = true;
    this.cdr.detectChanges();
    try {
        const paymentsRef = collection(db, 'Stores', this.selectedStore.id, 'payments');
        const q = query(paymentsRef, orderBy('date', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        this.billingHistory = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) { console.error("Error fetching billing:", error); } 
    finally { this.isBillingLoading = false; this.cdr.detectChanges(); }
  }

  async changePlan(plan: any) {
    if (!this.selectedStore) return;
    if (!confirm(`Are you sure you want to switch to the ${plan.name} plan for ₹${plan.price}?`)) return;
    
    this.isBillingLoading = true;
    try {
        const storeRef = doc(db, 'Stores', this.selectedStore.id);
        await updateDoc(storeRef, { plan: plan.name });
        
        const paymentsRef = collection(db, 'Stores', this.selectedStore.id, 'payments');
        await addDoc(paymentsRef, {
            invoiceId: 'INV-' + Date.now().toString().slice(-6),
            plan: plan.name,
            amount: plan.price,
            status: 'Paid',
            date: serverTimestamp(),
            method: 'Credit Card'
        });

        this.logAction('Change Plan', this.selectedStore.name, `Switched plan to ${plan.name}`);

        this.selectedStore.plan = plan.name; 
        this.openBilling(); 
        alert('Plan updated successfully!');
    } catch (error) { console.error("Plan update failed:", error); alert("Failed to update plan."); }
    finally { this.isBillingLoading = false; this.cdr.detectChanges(); }
  }

  downloadInvoice(invoice: any) {
    alert(`Downloading Invoice #${invoice.invoiceId}... (Mock Action)`);
  }

  backToStoreDetails() { this.viewMode = 'DETAILS'; this.cdr.detectChanges(); }
  formatDate(timestamp: any): string { if (!timestamp) return 'Never'; if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString(); return String(timestamp); }
  viewDetails(store: Store) { this.selectedStore = store; this.viewMode = 'DETAILS'; this.fetchStoreStats(store.id); this.cdr.detectChanges(); }
  backToList() { this.selectedStore = null; this.viewMode = 'LIST'; this.cdr.detectChanges(); }
  backToDetails() { this.viewMode = 'DETAILS'; this.subViewData = []; this.activeSubView = ''; this.cdr.detectChanges(); }
  get filteredStores() { if (!this.searchText) return this.stores; const lower = this.searchText.toLowerCase(); return this.stores.filter(s => s.name?.toLowerCase().includes(lower) || s.licenseKey?.toLowerCase().includes(lower)); }
}