import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, CartItem } from '../../core/dashboard.model';

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pos-terminal.component.html',
  styleUrls: ['./pos-terminal.component.css']
})
export class PosTerminalComponent {
  // Inputs
  @Input('posProducts') products: Product[] = []; 
  @Input() cart: CartItem[] = [];
  @Input('cartTotal') total: number = 0; 

  // Outputs
  @Output('addToCart') add = new EventEmitter<Product>(); 
  @Output('removeFromCart') remove = new EventEmitter<CartItem>();
  @Output('clearCart') clear = new EventEmitter<void>();
  @Output('checkout') checkout = new EventEmitter<void>();

  trackByProductId(index: number, product: Product): number { return product.id; }

  // Keyboard Shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    
    // Ctrl + Enter => Checkout (Only if cart has items)
    if (event.ctrlKey && event.key === 'Enter') {
      if (this.cart.length > 0) {
        event.preventDefault(); 
        this.checkout.emit();
      }
    }

    // Shift + Delete => Clear Cart (Only if cart has items)
    if (event.shiftKey && event.key === 'Delete') {
      if (this.cart.length > 0) {
        event.preventDefault();
        this.clear.emit();
      }
    }
  }
}