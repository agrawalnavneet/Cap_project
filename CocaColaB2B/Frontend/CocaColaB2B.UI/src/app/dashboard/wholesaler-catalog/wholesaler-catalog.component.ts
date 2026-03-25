import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product, Category } from '../../models/models';

@Component({
  selector: 'app-wholesaler-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>🛍️ Product Catalog</h2>
      <div class="search-bar">
        <input [(ngModel)]="searchTerm" (input)="filterProducts()" placeholder="Search products..." class="form-input search" />
        <select [(ngModel)]="categoryFilter" (change)="filterProducts()" class="form-input filter-select">
          <option value="">All Categories</option>
          <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
        </select>
      </div>
    </div>

    <div class="product-grid">
      <div *ngFor="let p of filteredProducts" class="product-card glass-panel">
        <div class="product-image">
          <img [src]="p.imageUrl || 'https://placehold.co/200x200/1a1a1e/ffffff?text='+p.name" [alt]="p.name" />
          <span *ngIf="p.discountPercentage" class="discount-badge">-{{ p.discountPercentage }}%</span>
        </div>
        <div class="product-info">
          <span class="category-label">{{ p.categoryName }}</span>
          <h3>{{ p.name }}</h3>
          <p class="desc">{{ p.description }}</p>
          <div class="product-footer">
            <div class="price-block">
              <span class="price">\${{ p.price | number:'1.2-2' }}</span>
              <span class="stock" [class.low]="p.quantityInStock < 100">{{ p.quantityInStock }} in stock</span>
            </div>
            <div class="qty-controls">
              <input [(ngModel)]="quantities[p.id]" type="number" min="1" value="1" class="qty-input" />
              <button class="btn-add" (click)="addToCart(p)" [disabled]="p.quantityInStock === 0">
                {{ p.quantityInStock === 0 ? 'Out of Stock' : '+ Cart' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="addedMessage" class="toast">{{ addedMessage }}</div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
    .search-bar { display: flex; gap: 12px; }
    .search { width: 260px; padding: 10px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: white; }
    .filter-select { width: 180px; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: white; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .product-card { border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; }
    .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
    .product-image { position: relative; height: 180px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .product-image img { max-height: 160px; max-width: 90%; object-fit: contain; }
    .discount-badge { position: absolute; top: 12px; right: 12px; background: var(--primary); color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
    .product-info { padding: 20px; }
    .category-label { font-size: 0.7rem; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .product-info h3 { margin: 8px 0; font-size: 1rem; }
    .desc { font-size: 0.82rem; color: rgba(255,255,255,0.4); margin-bottom: 16px; }
    .product-footer { display: flex; justify-content: space-between; align-items: flex-end; }
    .price-block { display: flex; flex-direction: column; }
    .price { font-size: 1.4rem; font-weight: 700; color: #10b981; }
    .stock { font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-top: 4px; }
    .stock.low { color: #f59e0b; }
    .qty-controls { display: flex; gap: 6px; align-items: center; }
    .qty-input { width: 50px; padding: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: white; text-align: center; }
    .btn-add { padding: 8px 14px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.8rem; transition: 0.2s; }
    .btn-add:hover { opacity: 0.9; }
    .btn-add:disabled { opacity: 0.4; cursor: not-allowed; }
    .toast { position: fixed; bottom: 30px; right: 30px; background: #10b981; color: white; padding: 14px 24px; border-radius: 10px; font-weight: 600; z-index: 1000; animation: fadeIn 0.3s ease; box-shadow: 0 8px 24px rgba(16,185,129,0.3); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class WholesalerCatalogComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  searchTerm = '';
  categoryFilter = '';
  quantities: { [key: string]: number } = {};
  addedMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getProducts().subscribe(p => { this.products = p; this.filteredProducts = p; p.forEach(x => this.quantities[x.id] = 1); });
    this.api.getCategories().subscribe(c => this.categories = c);
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchCategory = !this.categoryFilter || p.categoryId === this.categoryFilter;
      return matchSearch && matchCategory;
    });
  }

  addToCart(product: Product) {
    const qty = this.quantities[product.id] || 1;
    this.api.addToCart({ productId: product.id, quantity: qty }).subscribe(() => {
      this.addedMessage = `${product.name} x${qty} added to cart!`;
      setTimeout(() => this.addedMessage = '', 3000);
    });
  }
}
