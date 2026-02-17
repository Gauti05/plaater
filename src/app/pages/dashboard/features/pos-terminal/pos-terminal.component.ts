import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 🔥 Required for checkboxes

// Updated Interfaces
export interface Addon {
  id: number;
  name: string;
  price: number;
  selected?: boolean;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  color: string;
  icon: string;
  isVeg?: boolean;
  hasAddons?: boolean; // Trigger for modal
}

export interface CartItem extends Product {
  quantity: number;
  selectedAddons?: Addon[];
  cartItemId: string; // Unique ID to distinguish variations
}

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule], // 🔥 Added FormsModule
  templateUrl: './pos-terminal.component.html',
  styleUrls: ['./pos-terminal.component.css']
})
export class PosTerminalComponent {
  
  public orderNumber: number = 1001;

  // 🔥 Add-on State
  public isAddonModalOpen: boolean = false;
  public selectedProductForAddon: Product | null = null;
  public currentAddons: Addon[] = [];

  // Dummy Add-ons Data
  public dummyAddons: Addon[] = [
    { id: 101, name: 'Extra Cheese', price: 30, selected: false },
    { id: 102, name: 'Double Shot', price: 50, selected: false },
    { id: 103, name: 'Hazelnut Syrup', price: 40, selected: false },
    { id: 104, name: 'Oat Milk', price: 60, selected: false },
    { id: 105, name: 'Spicy Dip', price: 20, selected: false }
  ];

  public products: Product[] = [
    { id: 1, name: 'Espresso', price: 150, color: '#fca5a5', icon: '☕', isVeg: true, hasAddons: true },
    { id: 2, name: 'Cappuccino', price: 220, color: '#fdba74', icon: '🥛', isVeg: true, hasAddons: true },
    { id: 3, name: 'Chicken Wrap', price: 350, color: '#93c5fd', icon: '🌯', isVeg: false, hasAddons: true },
    { id: 4, name: 'Mocha', price: 240, color: '#bef264', icon: '🍫', isVeg: true, hasAddons: true },
    { id: 5, name: 'Croissant', price: 120, color: '#86efac', icon: '🥐', isVeg: true, hasAddons: false },
    { id: 6, name: 'Egg Bagel', price: 200, color: '#67e8f9', icon: '🥯', isVeg: false, hasAddons: true },
    { id: 7, name: 'Veg Sandwich', price: 180, color: '#93c5fd', icon: '🥪', isVeg: true, hasAddons: true },
    { id: 8, name: 'Caesar Salad', price: 280, color: '#c4b5fd', icon: '🥗', isVeg: false, hasAddons: true },
    { id: 9, name: 'Green Tea', price: 80, color: '#f9a8d4', icon: '🍵', isVeg: true, hasAddons: false },
    { id: 10, name: 'Water', price: 40, color: '#fda4af', icon: '💧', isVeg: true, hasAddons: false },
  ];

  public cart: CartItem[] = [];

  // Helper to calculate total price of a single item including add-ons
  getItemTotal(item: CartItem): number {
    const addonTotal = item.selectedAddons ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
    return (item.price + addonTotal) * item.quantity;
  }

  get cartTotal(): number { 
    return this.cart.reduce((sum, item) => sum + this.getItemTotal(item), 0); 
  }

  // 🔥 MAIN CLICK HANDLER
  handleProductClick(product: Product) {
    if (product.hasAddons) {
      this.openAddonModal(product);
    } else {
      this.addToCart(product, []);
    }
  }

  // Modal Logic
  openAddonModal(product: Product) {
    this.selectedProductForAddon = product;
    // Reset selection state for new add-on attempt
    this.currentAddons = this.dummyAddons.map(a => ({ ...a, selected: false }));
    this.isAddonModalOpen = true;
  }

  confirmAddons() {
    if (!this.selectedProductForAddon) return;
    const selected = this.currentAddons.filter(a => a.selected);
    this.addToCart(this.selectedProductForAddon, selected);
    this.closeAddonModal();
  }

  closeAddonModal() {
    this.isAddonModalOpen = false;
    this.selectedProductForAddon = null;
  }

  // 🔥 ADD TO CART LOGIC
  addToCart(product: Product, addons: Addon[] = []) { 
    const safeAddons = addons || [];
    
    // Create a unique key for this product + specific addon combo
    // e.g. "1-101,102" (Espresso with Extra Cheese & Double Shot)
    const addonIds = safeAddons.map(a => a.id).sort().join(',');
    const uniqueId = `${product.id}-${addonIds}`;

    const existingItem = this.cart.find(item => item.cartItemId === uniqueId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({ 
        ...product, 
        quantity: 1, 
        selectedAddons: safeAddons, 
        cartItemId: uniqueId 
      });
    }
  }

  increaseQty(item: CartItem) { 
    item.quantity++; 
  }

  decreaseQty(item: CartItem) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.removeFromCart(item);
    }
  }

  removeFromCart(item: CartItem) { 
    const index = this.cart.indexOf(item); 
    if (index > -1) { 
      this.cart.splice(index, 1); 
    }
  }

  clearCart() { 
    this.cart = []; 
  }

  processCheckout() { 
    if(this.cart.length > 0) { 
      alert(`Order #${this.orderNumber} Successful! Amount: ₹${this.cartTotal}`); 
      this.cart = []; 
      this.orderNumber++; 
    } else { 
      alert('Cart is empty!'); 
    } 
  }

  trackByProductId(index: number, product: Product): number { return product.id; }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'Enter') {
      if (this.cart.length > 0) {
        event.preventDefault(); 
        this.processCheckout();
      }
    }
    if (event.shiftKey && event.key === 'Delete') {
      if (this.cart.length > 0) {
        event.preventDefault();
        this.clearCart();
      }
    }
    if (event.key === 'Escape' && this.isAddonModalOpen) {
        this.closeAddonModal();
    }
  }
}