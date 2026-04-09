import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Product, Category } from '../../models/models';

@Component({
  selector: 'app-wholesaler-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>Product Catalog</h2>
      <div class="search-bar">
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input [(ngModel)]="searchTerm" (input)="filterProducts()" placeholder="Search products..." class="form-input search-input" />
        </div>
        <select [(ngModel)]="categoryFilter" (change)="filterProducts()" class="form-input filter-select">
          <option value="">All Categories</option>
          <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
        </select>
      </div>
    </div>

    <div *ngIf="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Loading products...</p>
    </div>

    <div class="product-grid" *ngIf="!isLoading">
      <div *ngFor="let p of filteredProducts" class="product-card">
        <div class="product-image">
          <img [src]="p.imageUrl || 'https://placehold.co/200x200/f0f0f5/4f46e5?text='+p.name" [alt]="p.name" />
          <span *ngIf="p.discountPercentage" class="discount-badge">-{{ p.discountPercentage }}%</span>
        </div>
        <div class="product-info">
          <span class="category-label">{{ p.categoryName }}</span>
          <h3>{{ p.name }}</h3>
          <p class="desc">{{ p.description }}</p>
          <div class="product-footer">
            <div class="price-block">
              <span class="price">₹{{ p.price | number:'1.2-2' }}</span>
              <span class="stock" [class.low]="p.quantityInStock < 100">{{ p.quantityInStock }} in stock</span>
            </div>
            <div class="qty-controls">
              <input [(ngModel)]="quantities[p.id]" type="number" min="10" value="10" class="qty-input"
                (change)="enforceMinQty(p.id)" />
              <button class="btn-add" (click)="addToCart(p)" [disabled]="p.quantityInStock === 0 || addingToCart[p.id]">
                <span *ngIf="addingToCart[p.id]">Adding...</span>
                <span *ngIf="!addingToCart[p.id]">{{ p.quantityInStock === 0 ? 'Out of Stock' : '+ Cart' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="addedMessage" class="toast success">{{ addedMessage }}</div>
    <div *ngIf="errorMessage" class="toast error">{{ errorMessage }}</div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .search-bar { display: flex; gap: 12px; }
    .search-box { position: relative; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 20px; color: var(--outline); }
    .search-input { width: 260px; padding: 10px 16px 10px 40px; }
    .filter-select { width: 180px; }

    .loading { text-align: center; padding: 60px 40px; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--surface-container-high); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading p { color: var(--outline); }

    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .product-card { background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; }
    .product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-xl); }
    .product-image { position: relative; height: 180px; background: var(--surface-container-low); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .product-image img { max-height: 160px; max-width: 90%; object-fit: contain; transition: transform 0.3s; }
    .product-card:hover .product-image img { transform: scale(1.05); }
    .discount-badge { position: absolute; top: 12px; right: 12px; background: var(--error); color: white; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; }
    .product-info { padding: 20px; }
    .category-label { font-size: 0.6rem; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
    .product-info h3 { margin: 6px 0; font-size: 1rem; font-weight: 700; color: var(--on-surface); }
    .desc { font-size: 0.8rem; color: var(--on-surface-variant); margin-bottom: 16px; }
    .product-footer { display: flex; justify-content: space-between; align-items: flex-end; }
    .price-block { display: flex; flex-direction: column; }
    .price { font-size: 1.35rem; font-weight: 700; color: var(--primary); font-family: 'Manrope', sans-serif; }
    .stock { font-size: 0.7rem; color: var(--outline); margin-top: 4px; }
    .stock.low { color: #b45309; }
    .qty-controls { display: flex; gap: 6px; align-items: center; }
    .qty-input { width: 50px; padding: 8px; background: var(--surface-container-low); border: 1px solid var(--outline-variant); border-radius: 8px; color: var(--on-surface); text-align: center; font-size: 0.85rem; }
    .qty-input:focus { outline: none; border-color: var(--primary); }
    .btn-add { padding: 8px 16px; background: linear-gradient(135deg, var(--primary), var(--primary-container)); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.75rem; transition: 0.2s; }
    .btn-add:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,0.25); }
    .btn-add:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
  `]
})
export class WholesalerCatalogComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  searchTerm = '';
  categoryFilter = '';
  quantities: { [key: string]: number } = {};
  addingToCart: { [key: string]: boolean } = {};
  addedMessage = '';
  errorMessage = '';
  isLoading = true;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    forkJoin({ products: this.api.getProducts(), inventory: this.api.getInventory() }).subscribe({
      next: ({ products, inventory }) => {
        this.products = products.map(p => {
          const inv = inventory.find(i => i.productSKU === p.sku);
          return { ...p, quantityInStock: inv ? inv.quantityInStock : p.quantityInStock };
        });
        this.filteredProducts = this.products;
        this.products.forEach(x => this.quantities[x.id] = 10);
        this.isLoading = false;
        // BUG-1 FIX: Force change detection after data loads
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load products.';
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
    this.api.getCategories().subscribe(c => {
      this.categories = c;
      this.cdr.detectChanges();
    });
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(p => {
      const s = p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                p.sku.toLowerCase().includes(this.searchTerm.toLowerCase());
      const c = !this.categoryFilter || p.categoryId === this.categoryFilter;
      return s && c;
    });
  }

  enforceMinQty(productId: string) {
    if (!this.quantities[productId] || this.quantities[productId] < 10) {
      this.quantities[productId] = 10;
    }
  }

  addToCart(product: Product) {
    if (!product || !product.id) {
      this.errorMessage = 'Invalid product selected.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    // Prevent duplicate clicks — bail if already adding this product
    if (this.addingToCart[product.id]) {
      return;
    }

    const rawQty = Number(this.quantities[product.id] ?? 10);
    const qty = Number.isFinite(rawQty) ? Math.max(Math.floor(rawQty), 10) : 10;
    this.quantities[product.id] = qty;

    const payload = {
      productId: product.id,
      quantity: qty,
      productName: (product.name || '').trim(),
      productPrice: Number(product.price ?? 0)
    };

    if (!payload.productName || payload.productPrice <= 0) {
      this.errorMessage = 'Product data is incomplete. Please refresh and try again.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    this.addingToCart[product.id] = true;
    this.cdr.detectChanges();

    this.api.addToCart(payload).subscribe({
      next: () => {
        this.addingToCart[product.id] = false;
        this.addedMessage = `${product.name} x${qty} added to cart!`;
        this.cdr.detectChanges();
        setTimeout(() => { this.addedMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.addingToCart[product.id] = false;

        if (err.status === 409) {
          // Concurrency conflict — show friendly message, do NOT retry
          this.errorMessage = 'Cart was updated. Please try adding the item again.';
        } else if (err.status === 401) {
          this.errorMessage = 'Session expired. Please log in again.';
        } else {
          this.errorMessage = err?.error?.error || err?.error?.message || 'Failed to add to cart.';
        }

        this.cdr.detectChanges();
        setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 5000);
      }
    });
  }
}
