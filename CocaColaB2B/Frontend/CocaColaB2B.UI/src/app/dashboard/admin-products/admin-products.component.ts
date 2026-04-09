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
      <h2>Product Catalog</h2>
      <button class="btn-primary" (click)="openAddModal()">
        <span class="material-symbols-outlined" style="font-size:18px">add</span> Add Product
      </button>
    </div>

    <div class="table-container">
      <table class="premium-table">
        <thead>
          <tr><th>SKU</th><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let product of products">
            <td class="mono">{{ product.sku }}</td>
            <td><img [src]="product.imageUrl || 'https://placehold.co/48x48/f0f0f5/4f46e5?text='+product.name" [alt]="product.name" class="product-thumb"/></td>
            <td><strong>{{ product.name }}</strong><div class="desc">{{ product.description }}</div></td>
            <td><span class="category-label">{{ product.categoryName || '-' }}</span></td>
            <td class="price">₹{{ product.price | number:'1.2-2' }}</td>
            <td class="actions">
              <button class="btn-icon" (click)="openEditModal(product)"><span class="material-symbols-outlined">edit</span></button>
              <button class="btn-icon delete" (click)="deleteProduct(product.id)"><span class="material-symbols-outlined">delete</span></button>
            </td>
          </tr>
          <tr *ngIf="products.length === 0"><td colspan="6" class="empty-state">No products found</td></tr>
        </tbody>
      </table>
    </div>

    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>{{ editingProduct ? 'Edit Product' : 'Add New Product' }}</h3>
        <div class="form-group"><label class="form-label">Name</label><input [(ngModel)]="form.name" class="form-input" /></div>
        <div class="form-group"><label class="form-label">SKU</label><input [(ngModel)]="form.sku" class="form-input" /></div>
        <div class="form-group"><label class="form-label">Description</label><input [(ngModel)]="form.description" class="form-input" /></div>
        <div class="form-group"><label class="form-label">Price</label><input [(ngModel)]="form.price" type="number" class="form-input" /></div>
        <div class="form-group"><label class="form-label">Image URL</label><input [(ngModel)]="form.imageUrl" class="form-input" /></div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select [(ngModel)]="form.categoryId" class="form-input">
            <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Discount %</label><input [(ngModel)]="form.discountPercentage" type="number" class="form-input" /></div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="showModal = false">Cancel</button>
          <button class="btn-primary" (click)="saveProduct()">{{ editingProduct ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .table-container { background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; }
    .mono { font-family: monospace; color: var(--on-surface-variant); }
    .product-thumb { width: 48px; height: 48px; object-fit: contain; border-radius: 10px; background: var(--surface-container-low); padding: 4px; }
    .category-label { font-size: 0.7rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
    .price { font-weight: 700; color: var(--secondary); font-size: 1rem; }
    .desc { font-size: 0.8rem; color: var(--on-surface-variant); margin-top: 4px; }
    .empty-state { text-align: center; color: var(--outline); padding: 40px !important; }
    .actions { display: flex; gap: 8px; }
    .btn-icon { background: var(--surface-container-low); border: none; color: var(--on-surface-variant); width: 36px; height: 36px; border-radius: 10px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
    .btn-icon .material-symbols-outlined { font-size: 18px; }
    .btn-icon:hover { background: var(--surface-container-high); color: var(--primary); }
    .btn-icon.delete:hover { background: rgba(186,26,26,0.08); color: var(--error); }
  `]
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  showModal = false;
  editingProduct: Product | null = null;
  form: any = {};

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadProducts(); this.api.getCategories().subscribe(c => this.categories = c); }
  loadProducts() { this.api.getProducts().subscribe({ next: (data) => this.products = data, error: (err) => console.error('Failed to load products', err) }); }
  openAddModal() { this.editingProduct = null; this.form = { price: 0, discountPercentage: 0 }; this.showModal = true; }
  openEditModal(product: Product) { this.editingProduct = product; this.form = { ...product }; this.showModal = true; }
  saveProduct() {
    if (this.editingProduct) { this.api.updateProduct(this.editingProduct.id, this.form).subscribe(() => { this.showModal = false; this.loadProducts(); }); }
    else { this.api.createProduct(this.form).subscribe(() => { this.showModal = false; this.loadProducts(); }); }
  }
  deleteProduct(id: string) { if (confirm('Are you sure you want to delete this product?')) { this.api.deleteProduct(id).subscribe({ next: () => this.loadProducts(), error: (err) => console.error('Failed to delete', err) }); } }
}
