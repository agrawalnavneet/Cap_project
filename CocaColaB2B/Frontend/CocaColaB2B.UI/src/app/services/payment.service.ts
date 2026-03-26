import { Injectable } from '@angular/core';

declare var Razorpay: any;

export interface RazorpayCheckoutOptions {
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  prefillName?: string;
  prefillEmail?: string;
  prefillContact?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  // Test key — replace with live key for production
  private razorpayKey = 'rzp_live_RjB2l83clIhDUf';

  openCheckout(options: RazorpayCheckoutOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const rzpOptions = {
        key: this.razorpayKey,
        amount: Math.round(options.amount * 100), // Razorpay expects amount in paisa
        currency: options.currency || 'INR',
        name: options.name || 'Coca-Cola B2B',
        description: options.description || 'B2B Order Payment',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Coca-Cola_bottle_cap.svg/200px-Coca-Cola_bottle_cap.svg.png',
        prefill: {
          name: options.prefillName || '',
          email: options.prefillEmail || '',
          contact: options.prefillContact || ''
        },
        theme: {
          color: '#F40009'
        },
        handler: (response: any) => {
          // Payment successful
          resolve(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment modal dismissed'));
          }
        }
      };

      try {
        const rzp = new Razorpay(rzpOptions);
        rzp.on('payment.failed', (response: any) => {
          reject(new Error(response.error?.description || 'Payment failed'));
        });
        rzp.open();
      } catch (error) {
        reject(new Error('Razorpay SDK not loaded. Please check your internet connection.'));
      }
    });
  }
}
