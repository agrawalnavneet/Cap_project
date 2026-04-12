import { Component, OnInit, inject, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CartService, CartItem } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ZoneHttpService } from '../../../../core/services/zone-http.service';
import { RazorpayService } from '../../../../core/services/razorpay.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';
import { LucideAngularModule } from 'lucide-angular';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-cart-slideover',
  standalone: false,
  templateUrl: './cart-slideover.component.html',
  styleUrls: ['./cart-slideover.component.scss']
})
export class CartSlideoverComponent implements OnInit {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private http = inject(ZoneHttpService);
  private razorpayService = inject(RazorpayService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // Expose cart signals
  items = this.cartService.items;
  total = this.cartService.total;
  isOpen = this.cartService.isOpen;
  notes = this.cartService.notes;
  count = this.cartService.count;

  // Local state
  shippingAddresses = signal<any[]>([]);
  selectedAddressId = signal<string>('');
  placing = signal(false);
  initializingPayment = signal(false);
  showInlineAddressForm = signal(false);
  savingInlineAddr = signal(false);
  inlineAddrItems = signal({ label: '', streetLine1: '', city: '', state: '', pinCode: '', district: '' });

  // Computed state
  gstAmount = computed(() => Number(this.total() || 0) * 0.18);
  shippingFee = signal(0);
  grandTotal = computed(() => Number(this.total() || 0) + Number(this.gstAmount() || 0));
  hasMinOrderIssue = computed(() => this.items().some(i => i.quantity < i.product.minOrderQuantity));
  selectedAddress = computed(() => this.shippingAddresses().find(a => a.addressId === this.selectedAddressId()));

  constructor() {
    // Refresh addresses when cart opens or user changes
    effect(() => {
      if (this.isOpen()) this.fetchAddresses();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.fetchAddresses();
  }

  fetchAddresses() {
    this.http.get<any[]>(API_ENDPOINTS.shippingAddress.base()).subscribe({
      next: (data) => {
        this.shippingAddresses.set(data);
        const defaultAddr = data.find(d => d.isDefault);
        if (defaultAddr) this.selectedAddressId.set(defaultAddr.addressId);
        else if (data.length > 0) this.selectedAddressId.set(data[0].addressId);
      }
    });
  }

  closeCart() { this.cartService.closeCart(); }

  updateQty(productId: string, qty: number) {
    if (qty < 1) return;
    this.cartService.updateQuantity(productId, qty);
  }

  removeItem(productId: string) {
    this.cartService.removeFromCart(productId);
  }

  setNotes(event: Event) {
    this.cartService.setNotes((event.target as HTMLTextAreaElement).value);
  }

  toggleInlineAddressForm() {
    this.showInlineAddressForm.update(v => !v);
    if (this.showInlineAddressForm()) {
      this.inlineAddrItems.set({ label: '', streetLine1: '', city: '', state: '', pinCode: '', district: '' });
    }
  }

  async placeOrder() {
    if (!this.selectedAddressId()) {
      this.toast.error('Please select a shipping address');
      return;
    }

    this.placing.set(true);
    const payload = {
      dealerId: this.authService.getDealerId() || '00000000-0000-0000-0000-000000000000',
      shippingAddressId: this.selectedAddressId(),
      lines: this.items().map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        sku: i.product.sku,
        unitPrice: i.product.price,
        quantity: i.quantity,
      })),
      paymentMode: 'PrePaid',
      notes: this.notes() || null,
    };

    try {
      const orderResp = await firstValueFrom(
        this.http.post<{ orderId: string; shippingFee?: number }>(API_ENDPOINTS.orders.base(), payload)
      );

      if (orderResp.shippingFee != null) {
        this.shippingFee.set(orderResp.shippingFee);
      }

      await this.handleRazorpay(orderResp.orderId, this.grandTotal());
    } catch (e) {
      this.toast.error('Failed to place order');
      this.placing.set(false);
    }
  }

  async handleRazorpay(orderId: string, amount: number) {
    try {
      this.initializingPayment.set(true);
      const rzpOrder = await firstValueFrom(this.razorpayService.createOrder(orderId, amount));
      this.initializingPayment.set(false);

      const totalRazorpayAmount = amount + (this.shippingFee() || 0);

      const options = {
        key: 'rzp_test_SUDVzwAKVeUa91',
        amount: Math.round(totalRazorpayAmount * 100).toString(),
        currency: 'INR',
        name: 'Coca-Cola B2B Supply Portal',
        description: `Order Payment — ${orderId.substring(0, 8).toUpperCase()}`,
        order_id: rzpOrder.razorpayOrderId,
        handler: async (response: any) => {
          try {
            await firstValueFrom(this.razorpayService.confirmPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId,
              amount,
            }));
            this.completeOrderSuccess(orderId);
          } catch (e) {
            this.toast.error('Payment verification failed.');
            this.placing.set(false);
          }
        },
        modal: {
          ondismiss: () => {
            this.toast.error('Payment cancelled. Check My Orders to complete payment.');
            this.placing.set(false);
            this.cartService.clearCart();
            this.closeCart();
            this.router.navigate(['/dealer/orders/', orderId]);
          },
        },
        theme: { color: '#F40009' }
      };

      this.razorpayService.openRazorpay(options);
    } catch (e) {
      this.initializingPayment.set(false);
      this.placing.set(false);
      this.toast.error('Failed to initialize Razorpay.');
    }
  }

  completeOrderSuccess(orderId: string) {
    this.toast.success('Order placed successfully!');
    this.cartService.clearCart();
    this.closeCart();
    this.placing.set(false);
    this.router.navigate(['/dealer/orders/', orderId]);
  }

  getInitials(name: string) {
    return name?.charAt(0)?.toUpperCase() || 'P';
  }

  getProductInitial(name: string) {
    return name?.charAt(0)?.toUpperCase() || 'P';
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeCart();
  }
}
