import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints';
import { ShippingAddress, AddShippingAddressDto } from '../models/shipping-address.model';

@Injectable({
  providedIn: 'root'
})
export class ShippingAddressService {
  private http = inject(HttpClient);

  // State
  private _addresses = signal<ShippingAddress[]>([]);
  private _loading = signal(false);

  // Computed
  addresses = computed(() => this._addresses());
  loading = computed(() => this._loading());
  defaultAddress = computed(() => this._addresses().find(a => a.isDefault));

  constructor() {
    this.refreshAddresses();
  }

  async refreshAddresses() {
    this._loading.set(true);
    try {
      const list = await firstValueFrom(this.http.get<ShippingAddress[]>(API_ENDPOINTS.shippingAddress.base()));
      this._addresses.set(list || []);
    } catch (err) {
      console.error('Failed to load addresses', err);
    } finally {
      this._loading.set(false);
    }
  }

  async addAddress(data: AddShippingAddressDto) {
    const res = await firstValueFrom(this.http.post<{ addressId: string }>(API_ENDPOINTS.shippingAddress.base(), data));
    await this.refreshAddresses();
    return res;
  }

  async updateAddress(id: string, data: Partial<AddShippingAddressDto>) {
    await firstValueFrom(this.http.put(API_ENDPOINTS.shippingAddress.byId(id), data));
    await this.refreshAddresses();
  }

  async deleteAddress(id: string) {
    await firstValueFrom(this.http.delete(API_ENDPOINTS.shippingAddress.byId(id)));
    await this.refreshAddresses();
  }

  async setDefault(id: string) {
    await firstValueFrom(this.http.put(API_ENDPOINTS.shippingAddress.setDefault(id), {}));
    await this.refreshAddresses();
  }
}

