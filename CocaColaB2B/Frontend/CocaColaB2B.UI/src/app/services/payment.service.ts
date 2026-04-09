import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../environments/environment';

declare var Razorpay: any;

export interface RazorpayCheckoutOptions {
  razorpayOrderId: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  prefillName?: string;
  prefillEmail?: string;
  prefillContact?: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  // Razorpay KEY ID (public key). Never use key secret on frontend.
  private razorpayKey = environment.razorpayKeyId || 'rzp_test_placeholder';

  constructor(private ngZone: NgZone) {}

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof Razorpay !== 'undefined') {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Razorpay SDK failed to load.'));
      document.body.appendChild(script);
    });
  }

  /**
   * Opens Razorpay checkout with a server-generated order ID.
   * Returns the full Razorpay response including payment_id, order_id, and signature
   * for server-side verification.
   *
   * BUG-3 FIX: All Razorpay callbacks (handler, ondismiss, payment.failed) now run
   * inside NgZone so Angular change detection is triggered properly.
   */
  async openCheckout(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResponse> {
    try {
      await this.loadScript();
    } catch (err) {
      return Promise.reject(err);
    }

    return new Promise((resolve, reject) => {
      if (typeof Razorpay === 'undefined') {
        reject(new Error('Razorpay SDK not loaded.'));
        return;
      }
      if (!this.razorpayKey || this.razorpayKey === 'rzp_test_placeholder') {
        reject(new Error('Razorpay key is not configured. Please set a valid key in environment.ts.'));
        return;
      }

      const rzpOptions = {
        key: this.razorpayKey,
        amount: Math.round(options.amount * 100), // Razorpay expects amount in paisa
        currency: options.currency || 'INR',
        name: options.name || 'Coca-Cola B2B',
        description: options.description || 'B2B Order Payment',
        order_id: options.razorpayOrderId, // Server-generated Razorpay order ID
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Coca-Cola_bottle_cap.svg/200px-Coca-Cola_bottle_cap.svg.png',
        prefill: {
          name: options.prefillName || '',
          email: options.prefillEmail || '',
          contact: options.prefillContact || ''
        },
        theme: { color: '#F40009' },
        // BUG-3 FIX: Wrap handler in NgZone.run() so Angular detects the state change
        handler: (response: any) => {
          this.ngZone.run(() => {
            resolve({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
          });
        },
        modal: {
          // BUG-3 FIX: Wrap ondismiss in NgZone.run()
          ondismiss: () => {
            this.ngZone.run(() => {
              reject(new Error('Payment modal dismissed by user'));
            });
          }
        }
      };

      try {
        const rzp = new Razorpay(rzpOptions);
        // BUG-3 FIX: Wrap payment.failed in NgZone.run()
        rzp.on('payment.failed', (response: any) => {
          this.ngZone.run(() => {
            reject(new Error(response.error?.description || 'Payment failed'));
          });
        });
        rzp.open();
      } catch (error) {
        reject(new Error('Failed to open Razorpay checkout. Check your Razorpay key.'));
      }
    });
  }
}
