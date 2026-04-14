import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints';

export interface Order {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  placedAt: string;
  dealerId: string;
  dealerName?: string;
  items: any[];
  lines?: any[];
  totalItems?: number;
  shippingAddress: any;
  paymentDetails?: any;
  statusHistory?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);

  // State
  private _orders = signal<Order[]>([]);
  private _loading = signal(false);
  private _selectedOrder = signal<Order | null>(null);

  // Computed
  orders = computed(() => this._orders());
  loading = computed(() => this._loading());
  selectedOrder = computed(() => this._selectedOrder());

  async loadMyOrders() {
    this._loading.set(true);
    try {
      const resp = await firstValueFrom(this.http.get<any>(API_ENDPOINTS.orders.myOrders()));
      // Assuming response structure like { items: Order[] } or just Order[]
      const data = resp?.items || resp || [];
      this._orders.set(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      this._loading.set(false);
    }
  }

  async loadOrderDetail(id: string) {
    this._loading.set(true);
    try {
      const order = await firstValueFrom(this.http.get<Order>(API_ENDPOINTS.orders.base() + '/' + id));
      this._selectedOrder.set(order);
      return order;
    } catch (err) {
      console.error('Failed to load order details', id, err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async placeOrder(payload: any) {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(this.http.post<any>(API_ENDPOINTS.orders.base(), payload));
      return res;
    } finally {
      this._loading.set(false);
    }
  }

  async cancelOrder(orderId: string, reason: string) {
    this._loading.set(true);
    try {
      await firstValueFrom(this.http.put(API_ENDPOINTS.orders.cancelOrder(orderId), { reason }));
      await this.loadMyOrders();
    } finally {
      this._loading.set(false);
    }
  }
}
