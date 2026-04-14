import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints';

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  unitOfMeasure: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);

  // State
  private _products = signal<Product[]>([]);
  private _categories = signal<Category[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Read-only accessors
  products = computed(() => this._products());
  categories = computed(() => this._categories());
  loading = computed(() => this._loading());
  error = computed(() => this._error());

  constructor() {
    this.loadCategories();
  }

  loadCategories() {
    this._loading.set(true);
    this.http.get<Category[]>(API_ENDPOINTS.catalog.categories())
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (data) => this._categories.set(data),
        error: (err) => this._error.set(err.message)
      });
  }

  loadProducts(params?: { categoryId?: string; inStockOnly?: boolean; searchTerm?: string }) {
    this._loading.set(true);
    this._error.set(null);

    let url = API_ENDPOINTS.catalog.products();
    const queryParams: string[] = [];
    if (params?.categoryId) queryParams.push(`categoryId=${params.categoryId}`);
    if (params?.inStockOnly) queryParams.push(`inStockOnly=true`);
    if (params?.searchTerm) queryParams.push(`searchTerm=${encodeURIComponent(params.searchTerm)}`);
    if (queryParams.length > 0) url += '?' + queryParams.join('&');

    this.http.get<any[]>(url)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (data) => {
          const mapped = data.map(p => ({
            ...p,
            id: p.productId || p.id,
            price: p.unitPrice || p.price,
            stockQuantity: p.availableStock !== undefined ? p.availableStock : p.stockQuantity,
            unitOfMeasure: 'unit'
          }));
          this._products.set(mapped);
        },
        error: (err) => this._error.set(err.message)
      });
  }
}
