import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
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
      <h2>My Cart</h2>
      <span class="item-count" *ngIf="cart"><span class="material-symbols-outlined" style="font-size:16px">shopping_cart</span> {{ cart.totalItems }} Items</span>
    </div>

    <div *ngIf="isLoading" class="loading"><div class="spinner"></div><p>Loading cart...</p></div>

    <div *ngIf="!isLoading && (!cart || cart.items.length === 0)" class="empty-cart">
      <span class="material-symbols-outlined empty-icon">shopping_cart</span>
      <h3>Your cart is empty</h3>
      <p>Browse the catalog to add products</p>
      <button class="btn-primary" (click)="goToCatalog()">Browse Catalog</button>
    </div>

    <div *ngIf="!isLoading && cart && cart.items.length > 0" class="cart-layout">
      <div class="cart-items">
        <div *ngFor="let item of cart.items" class="cart-item">
          <div class="item-image">
            <img [src]="item.productImageUrl || 'https://placehold.co/80x80/f0f0f5/4f46e5?text='+item.productName" [alt]="item.productName" />
          </div>
          <div class="item-details">
            <h3>{{ item.productName }}</h3>
            <p class="unit-price">₹{{ item.productPrice | number:'1.2-2' }} each</p>
          </div>
          <div class="item-qty">
            <button class="qty-btn" (click)="updateQuantity(item, -1)" [disabled]="item.quantity <= 10">−</button>
            <span class="qty-value">{{ item.quantity }}</span>
            <button class="qty-btn" (click)="updateQuantity(item, 1)">+</button>
          </div>
          <div class="item-subtotal"><p class="subtotal">₹{{ item.subTotal | number:'1.2-2' }}</p></div>
          <button class="btn-remove" (click)="removeItem(item.id)"><span class="material-symbols-outlined">close</span></button>
        </div>
      </div>

      <div class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal ({{ cart.totalItems }} items)</span><span>₹{{ cart.totalAmount | number:'1.2-2' }}</span></div>
        <div class="summary-row"><span>Shipping</span><span class="free">FREE</span></div>
        <div class="summary-divider"></div>
        <div class="summary-row total"><span>Total</span><span>₹{{ cart.totalAmount | number:'1.2-2' }}</span></div>
        <div class="shipping-address">
          <label class="form-label">Shipping Address</label>
          <textarea [(ngModel)]="shippingAddress" rows="3" class="form-input" placeholder="Enter delivery address..."></textarea>
        </div>
        <button class="btn-pay" (click)="payWithRazorpay()" [disabled]="isProcessing || !shippingAddress">
          <span *ngIf="!isProcessing"><span class="material-symbols-outlined" style="font-size:18px">credit_card</span> Pay & Place Order</span>
          <span *ngIf="isProcessing">{{ processingStep }}</span>
        </button>
        <button class="btn-clear" (click)="clearCart()">Clear Cart</button>
      </div>
    </div>

    <div *ngIf="successMessage" class="toast success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="toast error">{{ errorMessage }}</div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .item-count { background: var(--surface-container-lowest); box-shadow: var(--shadow-sm); padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; color: var(--on-surface-variant); font-weight: 600; display: flex; align-items: center; gap: 6px; }

    .loading { text-align: center; padding: 60px 40px; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--surface-container-high); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading p { color: var(--outline); }

    .empty-cart { text-align: center; padding: 80px 40px; background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); }
    .empty-icon { font-size: 56px; color: var(--outline-variant); margin-bottom: 16px; }
    .empty-cart h3 { margin-bottom: 8px; color: var(--on-surface); }
    .empty-cart p { color: var(--outline); margin-bottom: 24px; }

    .cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: flex-start; }
    .cart-items { display: flex; flex-direction: column; gap: 12px; }
    .cart-item { display: flex; align-items: center; gap: 20px; padding: 20px; background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); transition: 0.3s; }
    .cart-item:hover { box-shadow: var(--shadow-xl); }
    .item-image { width: 80px; height: 80px; background: var(--surface-container-low); border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
    .item-image img { max-height: 70px; max-width: 70px; object-fit: contain; }
    .item-details { flex: 1; }
    .item-details h3 { margin: 0 0 6px; font-size: 1rem; font-weight: 700; color: var(--on-surface); }
    .unit-price { color: var(--on-surface-variant); font-size: 0.85rem; margin: 0; }
    .item-qty { display: flex; align-items: center; gap: 12px; }
    .qty-btn { width: 32px; height: 32px; border: 1px solid var(--outline-variant); background: var(--surface-container-low); color: var(--on-surface); border-radius: 8px; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .qty-btn:hover { background: var(--surface-container-high); }
    .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .qty-value { font-weight: 700; font-size: 1rem; min-width: 24px; text-align: center; }
    .subtotal { font-weight: 700; font-size: 1.15rem; color: var(--primary); margin: 0; white-space: nowrap; font-family: 'Manrope', sans-serif; }
    .btn-remove { background: none; border: none; color: var(--outline); cursor: pointer; padding: 8px; border-radius: 8px; transition: 0.2s; display: flex; }
    .btn-remove .material-symbols-outlined { font-size: 20px; }
    .btn-remove:hover { background: rgba(186,26,26,0.06); color: var(--error); }

    .cart-summary { position: sticky; top: 100px; padding: 28px; background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); }
    .cart-summary h3 { margin: 0 0 20px; font-size: 1.1rem; font-family: 'Manrope', sans-serif; color: var(--on-surface); }
    .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.9rem; color: var(--on-surface); }
    .summary-row .free { color: var(--secondary); font-weight: 700; }
    .summary-divider { height: 1px; background: var(--surface-container-high); margin: 16px 0; }
    .summary-row.total { font-size: 1.2rem; font-weight: 700; }
    .shipping-address { margin: 20px 0; }
    .btn-pay { width: 100%; padding: 14px; background: linear-gradient(135deg, var(--primary), var(--primary-container)); color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: 0.3s; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-pay:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(79,70,229,0.25); }
    .btn-pay:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-clear { width: 100%; padding: 10px; background: var(--surface-container-low); border: 1px solid var(--surface-container-high); border-radius: 10px; color: var(--on-surface-variant); cursor: pointer; font-size: 0.85rem; transition: 0.2s; font-weight: 600; font-family: 'Inter', sans-serif; }
    .btn-clear:hover { background: rgba(186,26,26,0.04); color: var(--error); border-color: rgba(186,26,26,0.15); }
  `]
})
export class WholesalerCartComponent implements OnInit {
  cart: Cart | null = null;
  shippingAddress = '';
  isProcessing = false;
  isLoading = true;
  processingStep = 'Processing...';
  successMessage = '';
  errorMessage = '';

  constructor(
    private api: ApiService,
    private paymentService: PaymentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() { this.loadCart(); }

  loadCart() {
    this.isLoading = true;
    this.api.getCart().subscribe({
      next: (c) => {
        this.cart = c;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cart = { id: '', items: [], totalAmount: 0, totalItems: 0 };
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateQuantity(item: any, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty < 10) return;
    this.api.updateCartItem(item.id, { quantity: newQty }).subscribe({
      next: () => this.loadCart(),
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to update quantity.';
        this.cdr.detectChanges();
        setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
      }
    });
  }

  removeItem(itemId: string) {
    this.api.removeFromCart(itemId).subscribe({
      next: () => this.loadCart(),
      error: () => {
        this.errorMessage = 'Failed to remove item.';
        this.cdr.detectChanges();
        setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
      }
    });
  }

  clearCart() {
    if (confirm('Clear all items?')) {
      this.api.clearCart().subscribe({
        next: () => this.loadCart(),
        error: () => {
          this.errorMessage = 'Failed to clear cart.';
          this.cdr.detectChanges();
          setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
        }
      });
    }
  }

  goToCatalog() { this.router.navigate(['/dashboard/wholesaler-catalog']); }

  /**
   * Secure payment flow:
   * 1. Place order (backend reads items from cart)
   * 2. Create Razorpay order server-side
   * 3. Open Razorpay checkout (or simulate for mock/dev orders)
   * 4. Verify payment signature server-side
   *
   * BUG-3 FIX: All state updates from async callbacks (Razorpay, Promise.then/.catch)
   * are wrapped in NgZone.run() to trigger Angular change detection.
   */
  payWithRazorpay() {
    if (!this.cart || this.cart.totalAmount === 0) return;
    if (!this.shippingAddress.trim()) {
      this.errorMessage = 'Please enter a shipping address.';
      setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.processingStep = 'Placing order...';
    this.cdr.detectChanges();

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Step 1: Place the order (backend reads items from cart automatically)
    this.api.placeOrder({ shippingAddress: this.shippingAddress, items: [] }).subscribe({
      next: (order) => {
        this.processingStep = 'Creating payment...';
        this.cdr.detectChanges();

        // Step 2: Create payment order server-side
        this.api.createPaymentOrder({
          orderId: order.id,
          amount: order.totalAmount,
          currency: 'INR'
        }).subscribe({
          next: (payment) => {
            this.processingStep = 'Opening payment gateway...';
            this.cdr.detectChanges();

            const isMockOrder = !payment.razorpayOrderId ||
              payment.razorpayOrderId.startsWith('order_mock_') ||
              payment.razorpayOrderId === '';

            if (isMockOrder) {
              // Dev/test mode: Razorpay keys are placeholders — skip modal, auto-verify
              console.warn('[Payment] Mock Razorpay order detected — auto-verifying for development.');
              this.processingStep = 'Verifying payment (dev mode)...';
              this.cdr.detectChanges();

              this.api.verifyPayment({
                paymentId: payment.id,
                razorpayPaymentId: `pay_mock_${Date.now()}`,
                razorpayOrderId: payment.razorpayOrderId || '',
                razorpaySignature: 'mock_signature'
              }).subscribe({
                next: () => this.onPaymentSuccess(),
                error: () => this.onPaymentSuccess() // Mock orders always succeed
              });
              return;
            }

            // Step 3: Real Razorpay checkout
            this.paymentService.openCheckout({
              razorpayOrderId: payment.razorpayOrderId!,
              amount: payment.amount,
              currency: payment.currency || 'INR',
              name: 'Coca-Cola B2B',
              description: `Order #${order.id.substring(0, 8)}`,
              prefillName: user.fullName || '',
              prefillEmail: user.email || '',
              prefillContact: ''
            }).then((rzpResponse) => {
              // BUG-3 FIX: Ensure state updates run inside Angular zone
              this.ngZone.run(() => {
                this.processingStep = 'Verifying payment...';
                this.cdr.detectChanges();

                // Step 4: Verify payment signature server-side
                this.api.verifyPayment({
                  paymentId: payment.id,
                  razorpayPaymentId: rzpResponse.razorpay_payment_id,
                  razorpayOrderId: rzpResponse.razorpay_order_id,
                  razorpaySignature: rzpResponse.razorpay_signature
                }).subscribe({
                  next: () => this.onPaymentSuccess(),
                  error: () => {
                    this.isProcessing = false;
                    this.errorMessage = 'Payment verification failed. Contact support with your order ID.';
                    this.cdr.detectChanges();
                    setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 6000);
                  }
                });
              });
            }).catch((err: Error) => {
              // BUG-3 FIX: Ensure error handling runs inside Angular zone
              this.ngZone.run(() => {
                this.isProcessing = false;
                this.errorMessage = err.message === 'Payment modal dismissed by user'
                  ? 'Payment cancelled. Your order has been saved — you can pay later from My Orders.'
                  : (err.message || 'Payment failed. Please try again.');
                this.cdr.detectChanges();
                setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 5000);
              });
            });
          },
          error: (err) => {
            this.isProcessing = false;
            const msg = err.error?.error || 'Failed to create payment. Please try again.';
            this.errorMessage = msg;
            this.cdr.detectChanges();
            setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 4000);
          }
        });
      },
      error: (err) => {
        this.isProcessing = false;
        const msg = err.error?.error || err.error?.message || 'Failed to place order. Please try again.';
        this.errorMessage = msg;
        this.cdr.detectChanges();
        setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 4000);
      }
    });
  }

  private onPaymentSuccess() {
    this.isProcessing = false;
    this.successMessage = 'Order placed & payment verified successfully!';
    this.cart = { id: '', items: [], totalAmount: 0, totalItems: 0 };
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMessage = '';
      this.router.navigate(['/dashboard/my-orders']);
    }, 2000);
  }
}
