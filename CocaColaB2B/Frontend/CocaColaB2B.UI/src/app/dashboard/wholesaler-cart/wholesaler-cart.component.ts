import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PaymentService } from '../../services/payment.service';
import { Cart } from '../../models/models';

@Component({
  selector: 'app-wholesaler-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>🛒 My Cart</h2>
      <span class="item-count" *ngIf="cart">{{ cart.totalItems }} Items</span>
    </div>

    <div *ngIf="!cart || cart.items.length === 0" class="empty-cart glass-panel">
      <div class="empty-icon">🛒</div>
      <h3>Your cart is empty</h3>
      <p>Browse the catalog to add products</p>
      <button class="btn-primary" (click)="goToCatalog()">Browse Catalog</button>
    </div>

    <div *ngIf="cart && cart.items.length > 0" class="cart-layout">
      <div class="cart-items">
        <div *ngFor="let item of cart.items" class="cart-item glass-panel">
          <div class="item-image">
            <img [src]="item.productImageUrl || 'https://placehold.co/80x80/1a1a1e/ffffff?text='+item.productName" [alt]="item.productName" />
          </div>
          <div class="item-details">
            <h3>{{ item.productName }}</h3>
            <p class="unit-price">\${{ item.productPrice | number:'1.2-2' }} each</p>
          </div>
          <div class="item-qty">
            <button class="qty-btn" (click)="updateQuantity(item, -1)" [disabled]="item.quantity <= 1">−</button>
            <span class="qty-value">{{ item.quantity }}</span>
            <button class="qty-btn" (click)="updateQuantity(item, 1)">+</button>
          </div>
          <div class="item-subtotal">
            <p class="subtotal">\${{ item.subTotal | number:'1.2-2' }}</p>
          </div>
          <button class="btn-remove" (click)="removeItem(item.id)">✕</button>
        </div>
      </div>

      <div class="cart-summary glass-panel">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal ({{ cart.totalItems }} items)</span>
          <span>\${{ cart.totalAmount | number:'1.2-2' }}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span class="free">FREE</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row total">
          <span>Total</span>
          <span>\${{ cart.totalAmount | number:'1.2-2' }}</span>
        </div>

        <div class="shipping-address">
          <label>Shipping Address</label>
          <textarea [(ngModel)]="shippingAddress" rows="3" class="form-input" placeholder="Enter delivery address..."></textarea>
        </div>

        <button class="btn-pay" (click)="payWithRazorpay()" [disabled]="isProcessing || !shippingAddress">
          <span *ngIf="!isProcessing">💳 Pay & Place Order</span>
          <span *ngIf="isProcessing">Processing...</span>
        </button>

        <button class="btn-clear" (click)="clearCart()">Clear Cart</button>
      </div>
    </div>

    <div *ngIf="successMessage" class="toast success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="toast error">{{ errorMessage }}</div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    .item-count { background: rgba(255,255,255,0.08); padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; color: rgba(255,255,255,0.6); }

    .empty-cart { text-align: center; padding: 80px 40px; border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); }
    .empty-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.5; }
    .empty-cart h3 { margin-bottom: 8px; }
    .empty-cart p { color: rgba(255,255,255,0.4); margin-bottom: 24px; }

    .cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: flex-start; }

    .cart-items { display: flex; flex-direction: column; gap: 12px; }
    .cart-item { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
    .cart-item:hover { border-color: rgba(255,255,255,0.1); }
    .item-image { width: 80px; height: 80px; background: rgba(255,255,255,0.03); border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
    .item-image img { max-height: 70px; max-width: 70px; object-fit: contain; }
    .item-details { flex: 1; }
    .item-details h3 { margin: 0 0 6px; font-size: 1rem; }
    .unit-price { color: rgba(255,255,255,0.4); font-size: 0.85rem; margin: 0; }

    .item-qty { display: flex; align-items: center; gap: 12px; }
    .qty-btn { width: 32px; height: 32px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: white; border-radius: 8px; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .qty-btn:hover { background: rgba(255,255,255,0.1); }
    .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .qty-value { font-weight: 700; font-size: 1rem; min-width: 24px; text-align: center; }

    .subtotal { font-weight: 700; font-size: 1.15rem; color: #10b981; margin: 0; white-space: nowrap; }
    .btn-remove { background: none; border: none; color: rgba(255,255,255,0.3); font-size: 1.2rem; cursor: pointer; padding: 8px; border-radius: 6px; transition: 0.2s; }
    .btn-remove:hover { background: rgba(244,0,9,0.15); color: var(--primary); }

    .cart-summary { position: sticky; top: 100px; padding: 28px; border-radius: 16px; background: rgba(26,26,30,0.8); border: 1px solid rgba(255,255,255,0.05); }
    .cart-summary h3 { margin: 0 0 20px; font-size: 1.1rem; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.95rem; }
    .summary-row .free { color: #10b981; font-weight: 600; }
    .summary-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 16px 0; }
    .summary-row.total { font-size: 1.2rem; font-weight: 700; color: white; }

    .shipping-address { margin: 20px 0; }
    .shipping-address label { display: block; margin-bottom: 8px; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
    .form-input { width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: white; font-size: 0.9rem; resize: vertical; }
    .form-input:focus { outline: none; border-color: var(--primary); }

    .btn-pay { width: 100%; padding: 14px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.3s; margin-bottom: 12px; }
    .btn-pay:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16,185,129,0.3); }
    .btn-pay:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-clear { width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 0.85rem; transition: 0.2s; }
    .btn-clear:hover { background: rgba(244,0,9,0.1); color: var(--primary); border-color: rgba(244,0,9,0.2); }
    .btn-primary { padding: 12px 28px; background: var(--primary); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; }

    .toast { position: fixed; bottom: 30px; right: 30px; padding: 14px 28px; border-radius: 12px; font-weight: 600; z-index: 1000; animation: slideIn 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .toast.success { background: #10b981; color: white; }
    .toast.error { background: #ef4444; color: white; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class WholesalerCartComponent implements OnInit {
  cart: Cart | null = null;
  shippingAddress = '';
  isProcessing = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private api: ApiService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.api.getCart().subscribe({
      next: (c) => this.cart = c,
      error: () => this.cart = { id: '', items: [], totalAmount: 0, totalItems: 0 }
    });
  }

  updateQuantity(item: any, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    this.api.addToCart({ productId: item.productId, quantity: newQty }).subscribe(() => this.loadCart());
  }

  removeItem(itemId: string) {
    this.api.removeFromCart(itemId).subscribe(() => this.loadCart());
  }

  clearCart() {
    if (confirm('Clear all items from cart?')) {
      this.api.clearCart().subscribe(() => this.loadCart());
    }
  }

  goToCatalog() {
    this.router.navigate(['/dashboard/wholesaler-catalog']);
  }

  payWithRazorpay() {
    if (!this.cart || this.cart.totalAmount === 0) return;
    this.isProcessing = true;
    this.errorMessage = '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    this.paymentService.openCheckout({
      amount: this.cart.totalAmount,
      currency: 'INR',
      name: 'Coca-Cola B2B',
      description: `Order - ${this.cart.totalItems} items`,
      prefillName: user.fullName || '',
      prefillEmail: user.email || '',
      prefillContact: ''
    }).then((paymentId: string) => {
      // Payment successful — place order
      this.api.placeOrder({
        shippingAddress: this.shippingAddress,
        paymentId: paymentId
      }).subscribe({
        next: () => {
          this.successMessage = '✅ Order placed successfully!';
          this.cart = { id: '', items: [], totalAmount: 0, totalItems: 0 };
          setTimeout(() => {
            this.successMessage = '';
            this.router.navigate(['/dashboard/my-orders']);
          }, 2000);
        },
        error: () => {
          this.errorMessage = 'Order placement failed. Please try again.';
          setTimeout(() => this.errorMessage = '', 4000);
        },
        complete: () => this.isProcessing = false
      });
    }).catch(() => {
      this.isProcessing = false;
      this.errorMessage = 'Payment cancelled or failed.';
      setTimeout(() => this.errorMessage = '', 4000);
    });
  }
}
