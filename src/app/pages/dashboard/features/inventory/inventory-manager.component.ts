import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-inventory-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-manager.component.html',
  styleUrls: ['./inventory-manager.component.css']
})
export class InventoryManagerComponent implements OnChanges {
  @Input() inventory: InventoryItem[] = [];
  @Output() addItem = new EventEmitter<void>();
  @Output() editItem = new EventEmitter<InventoryItem>();
  @Output() deleteItem = new EventEmitter<string>();

  public filteredInventory: InventoryItem[] = [];
  public searchText: string = '';
  public filterCategory: string = '';
  public filterStatus: string = '';

  public uniqueCategories: string[] = [];
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['inventory']) {
      this.uniqueCategories = [...new Set(this.inventory.map(i => i.category))];
      this.applyFilters();
    }
  }

  applyFilters() {
    let temp = [...this.inventory];

    // Text Search
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.sku.toLowerCase().includes(term)
      );
    }

    // Category Filter
    if (this.filterCategory) {
      temp = temp.filter(item => item.category === this.filterCategory);
    }

    // Status Filter
    if (this.filterStatus) {
      temp = temp.filter(item => item.status === this.filterStatus);
    }

    this.filteredInventory = temp;
  }

  // Helper to determine status color dynamically
  getStatusColor(status: string): string {
    switch (status) {
      case 'In Stock': return 'green';
      case 'Low Stock': return 'orange';
      case 'Out of Stock': return 'red';
      default: return 'gray';
    }
  }

  // Stock Level Progress Bar width
  getStockPercent(item: InventoryItem): number {
    // Arbitrary max for visualization, say 100
    return Math.min((item.stock / 100) * 100, 100);
  }
}