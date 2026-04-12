import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints';

export interface CartItem {
  product: any;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);

  // Signals for state
  private _items = signal<CartItem[]>([]);
  private _isOpen = signal<boolean>(false);
  private _paymentMode = signal<'COD' | 'PrePaid'>('COD');
  private _notes = signal<string>('');

  // Computed properties
  items = computed(() => this._items());
  isOpen = computed(() => this._isOpen());
  paymentMode = computed(() => this._paymentMode());
  notes = computed(() => this._notes());
  
  count = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  total = computed(() => this._items().reduce((sum, i) => sum + (i.product.unitPrice * i.quantity), 0));

  constructor() {
    // Load state from localStorage on init
    const saved = localStorage.getItem('hul_cart_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this._items.set(state.items || []);
        this._paymentMode.set(state.paymentMode || 'COD');
        this._notes.set(state.notes || '');
      } catch (e) {
        console.error('Failed to parse cart state from localStorage', e);
      }
    }

    // Persist state to localStorage on changes
    effect(() => {
      const state = {
        items: this._items(),
        paymentMode: this._paymentMode(),
        notes: this._notes()
      };
      localStorage.setItem('hul_cart_state', JSON.stringify(state));
    });
  }

  toggleCart() { this._isOpen.update(v => !v); }
  openCart() { this._isOpen.set(true); }
  closeCart() { this._isOpen.set(false); }

  addToCart(product: any, quantity: number) {
    this._items.update(items => {
      const existing = items.find(i => i.product.productId === product.productId);
      if (existing) {
        return items.map(i => i.product.productId === product.productId 
          ? { ...i, quantity: i.quantity + quantity } 
          : i);
      }
      return [...items, { product, quantity }];
    });
    this.openCart(); // UX: open cart when item added
  }

  removeFromCart(productId: string) {
    this._items.update(items => items.filter(i => i.product.productId !== productId));
  }

  updateQuantity(productId: string, quantity: number) {
    this._items.update(items => items.map(i => 
      i.product.productId === productId ? { ...i, quantity } : i));
  }

  clearCart() {
    this._items.set([]);
    this._notes.set('');
  }

  setPaymentMode(mode: 'COD' | 'PrePaid') { this._paymentMode.set(mode); }
  setNotes(notes: string) { this._notes.set(notes); }

  /**
   * Reserve inventory when adding item to cart
   */
  reserveInventory(productId: string, quantity: number): Observable<any> {
    return this.http.post(`${API_ENDPOINTS.inventory.base()}/reserve`, {
      productId,
      quantity
    });
  }

  /**
   * Release inventory reservation when removing item from cart
   */
  releaseInventory(productId: string): Observable<any> {
    return this.http.post(`${API_ENDPOINTS.inventory.base()}/release`, {
      productId
    });
  }

  /**
   * Release all inventory reservations (clear cart)
   */
  releaseAllInventory(): Observable<any> {
    return this.http.post(`${API_ENDPOINTS.inventory.base()}/release-all`, {});
  }
}

