import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product, Category } from '../../models/models';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>Manage Products</h2>
      <button class="btn-primary" (click)="openAddModal()">+ Add Product</button>
    </div>

    <div class="table-container glass-panel">
      <table class="premium-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let product of products">
            <td class="mono">{{ product.sku }}</td>
            <td>
              <img [src]="product.imageUrl || 'https://placehold.co/48x48/1a1a1e/ffffff?text='+product.name" [alt]="product.name" class="product-thumb"/>
            </td>
            <td>
              <strong>{{ product.name }}</strong>
              <div class="desc">{{ product.description }}</div>
            </td>
            <td><span class="category-label">{{ product.categoryName || '-' }}</span></td>
            <td class="price">\${{ product.price | number:'1.2-2' }}</td>
            <td class="actions">
              <button class="btn-icon" (click)="openEditModal(product)">✎</button>
              <button class="btn-icon delete" (click)="deleteProduct(product.id)">🗑</button>
            </td>
          </tr>
          <tr *ngIf="products.length === 0">
            <td colspan="6" class="empty-state">No products found. Add your first Coca-Cola product!</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Product Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal glass-panel" (click)="$event.stopPropagation()">
        <h3>{{ editingProduct ? 'Edit Product' : 'Add New Product' }}</h3>
        <div class="form-group"><label>Name</label><input [(ngModel)]="form.name" class="form-input" /></div>
        <div class="form-group"><label>SKU</label><input [(ngModel)]="form.sku" class="form-input" /></div>
        <div class="form-group"><label>Description</label><input [(ngModel)]="form.description" class="form-input" /></div>
        <div class="form-group"><label>Price</label><input [(ngModel)]="form.price" type="number" class="form-input" /></div>
        <div class="form-group"><label>Image URL</label><input [(ngModel)]="form.imageUrl" class="form-input" /></div>
        <div class="form-group">
          <label>Category</label>
          <select [(ngModel)]="form.categoryId" class="form-input">
            <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="form-group"><label>Discount %</label><input [(ngModel)]="form.discountPercentage" type="number" class="form-input" /></div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="showModal = false">Cancel</button>
          <button class="btn-primary" (click)="saveProduct()">{{ editingProduct ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .table-container { padding: 0; overflow: hidden; border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { background: rgba(0,0,0,0.2); padding: 16px 24px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }
    .premium-table td { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .mono { font-family: monospace; color: rgba(255,255,255,0.6); }
    .product-thumb { width: 48px; height: 48px; object-fit: contain; border-radius: 8px; background: rgba(255,255,255,0.05); padding: 4px; }
    .category-label { font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .price { font-weight: bold; color: #10b981; font-size: 1.1rem; }
    .desc { font-size: 0.85rem; color: rgba(255,255,255,0.4); margin-top: 4px; }
    .empty-state { text-align: center; color: rgba(255,255,255,0.3); padding: 40px !important; }
    .actions { display: flex; gap: 8px; }
    .btn-icon { background: rgba(255,255,255,0.08); border: none; color: white; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
    .btn-icon:hover { background: rgba(255,255,255,0.15); }
    .btn-icon.delete:hover { background: rgba(244,0,9,0.3); }
    .btn-primary { padding: 10px 24px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.2s; }
    .btn-primary:hover { opacity: 0.9; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { width: 500px; padding: 32px; border-radius: 16px; background: rgba(26,26,30,0.98); border: 1px solid rgba(255,255,255,0.08); max-height: 90vh; overflow-y: auto; }
    .modal h3 { margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
    .form-input { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 0.9rem; }
    .form-input:focus { outline: none; border-color: var(--primary); }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .btn-secondary { padding: 10px 24px; background: rgba(255,255,255,0.08); color: white; border: none; border-radius: 8px; cursor: pointer; }
  `]
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  showModal = false;
  editingProduct: Product | null = null;
  form: any = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadProducts();
    this.api.getCategories().subscribe(c => this.categories = c);
  }

  loadProducts() {
    this.api.getProducts().subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error('Failed to load products', err)
    });
  }

  openAddModal() {
    this.editingProduct = null;
    this.form = { price: 0, discountPercentage: 0 };
    this.showModal = true;
  }

  openEditModal(product: Product) {
    this.editingProduct = product;
    this.form = { ...product };
    this.showModal = true;
  }

  saveProduct() {
    if (this.editingProduct) {
      this.api.updateProduct(this.editingProduct.id, this.form).subscribe(() => {
        this.showModal = false;
        this.loadProducts();
      });
    } else {
      this.api.createProduct(this.form).subscribe(() => {
        this.showModal = false;
        this.loadProducts();
      });
    }
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.api.deleteProduct(id).subscribe({
        next: () => this.loadProducts(),
        error: (err) => console.error('Failed to delete', err)
      });
    }
  }
}

