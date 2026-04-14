import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService, Product, Category } from '../../../../core/services/catalog.service';
import { CartService } from '../../../../core/services/cart.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';
import { environment } from '../../../../../environments/environment';
import { SharedModule } from '../../../../shared/shared.module';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-catalog',
  standalone: false,
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);
  private toast = inject(ToastService);
  private http = inject(HttpClient);

  // Expose service signals
  loading = this.catalogService.loading;
  categories = this.catalogService.categories;
  products = this.catalogService.products;
  error = this.catalogService.error;

  // Local component state
  searchTerm = signal('');
  inStockOnly = signal(false);
  selectedCategoryId = signal<string | null>(null);
  selectedBrands = signal<Set<string>>(new Set());
  quantities = signal<Record<string, number>>({});
  favorites = signal<Set<string>>(new Set());

  // Computed state
  filteredProducts = computed(() => {
    let list = this.products();
    const search = this.searchTerm().toLowerCase();
    const catId = this.selectedCategoryId();
    const brands = this.selectedBrands();
    const onlyStock = this.inStockOnly();

    if (search) {
      list = list.filter(p => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search));
    }

    if (catId) {
      list = list.filter(p => p.categoryId === catId);
    }

    if (onlyStock) {
      list = list.filter(p => p.stockQuantity > 0);
    }

    if (brands.size > 0) {
      list = list.filter(p => brands.has(p.categoryName)); // Assuming categoryName acts as brand or adjust as needed
    }

    return list;
  });

  availableBrands = computed(() => {
    const brands = new Set(this.products().map(p => p.categoryName).filter(Boolean));
    return Array.from(brands).sort();
  });

  constructor() {
    // When filters change, we don't necessarily need to reload from server
    // unless the server does the filtering. In this project, it seems it does.
    effect(() => {
      this.catalogService.loadProducts({
        searchTerm: this.searchTerm(),
        inStockOnly: this.inStockOnly(),
        categoryId: this.selectedCategoryId() || undefined
      });
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    this.http.get<any[]>(API_ENDPOINTS.catalog.favorites()).subscribe({
      next: (data) => this.favorites.set(new Set(data.map(f => f.productId))),
      error: () => {}
    });
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
  }

  onCategoryChange(categoryId: string | null) {
    this.selectedCategoryId.set(categoryId);
  }

  onStockToggle(onlyStock: boolean) {
    this.inStockOnly.set(onlyStock);
  }

  onBrandChange(brand: string, checked: boolean) {
    const brands = new Set(this.selectedBrands());
    if (checked) brands.add(brand);
    else brands.delete(brand);
    this.selectedBrands.set(brands);
  }

  resetFilters() {
    this.searchTerm.set('');
    this.inStockOnly.set(false);
    this.selectedCategoryId.set(null);
    this.selectedBrands.set(new Set());
  }

  hasActiveFilters() {
    return !!this.searchTerm() || this.inStockOnly() || !!this.selectedCategoryId() || this.selectedBrands().size > 0;
  }

  getQty(productId: string, minQty: number = 1) {
    return this.quantities()[productId] || minQty;
  }

  updateQty(productId: string, delta: number, minQty: number = 1) {
    const current = this.getQty(productId, minQty);
    const newVal = Math.max(minQty, current + delta);
    this.quantities.update(q => ({ ...q, [productId]: newVal }));
  }

  addToCart(product: Product) {
    const qty = this.getQty(product.id, 1);
    this.cartService.addToCart(product, qty);
    this.toast.success(`Added ${qty} ${product.name} to cart`);
  }


  toggleFavorite(productId: string) {
    this.http.post<any>(API_ENDPOINTS.catalog.toggleFavorite(productId), {}).subscribe({
      next: (resp) => {
        const favs = new Set(this.favorites());
        if (resp.isFavorited) favs.add(productId);
        else favs.delete(productId);
        this.favorites.set(favs);
        this.toast.success(resp.message);
      }
    });
  }

  resolveImageUrl(url: string) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return environment.gatewayUrl + url;
  }
}

