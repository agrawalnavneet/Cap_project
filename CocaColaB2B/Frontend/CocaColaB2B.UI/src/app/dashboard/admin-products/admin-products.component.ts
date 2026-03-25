import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>Manage Products</h2>
      <button class="btn-primary" (click)="openAddModal()">Add Product</button>
    </div>

    <div class="table-container glass-panel">
      <table class="premium-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let product of products">
            <td>{{ product.sku }}</td>
            <td>
              <img [src]="product.imageUrl || 'assets/placeholder.png'" alt="Product Image" class="product-thumb"/>
            </td>
            <td>
              <strong>{{ product.name }}</strong>
              <div class="desc">{{ product.description }}</div>
            </td>
            <td class="price">\${{ product.price }}</td>
            <td class="actions">
              <button class="btn-icon">✎</button>
              <button class="btn-icon delete" (click)="deleteProduct(product.id)">🗑</button>
            </td>
          </tr>
          <tr *ngIf="products.length === 0">
            <td colspan="5" class="empty-state">No products found. Add your first Coca-Cola product!</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .table-container {
      padding: 0;
      overflow: hidden;
    }
    .premium-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .premium-table th {
      background: rgba(0,0,0,0.2);
      padding: 16px 24px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.5px;
    }
    .premium-table td {
      padding: 16px 24px;
      border-bottom: 1px solid var(--glass-border);
      vertical-align: middle;
    }
    .product-thumb {
      width: 48px;
      height: 48px;
      object-fit: contain;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      padding: 4px;
    }
    .price { font-weight: bold; color: var(--primary); font-size: 1.1rem; }
    .desc { font-size: 0.85rem; color: #888; margin-top: 4px; }
    .empty-state { text-align: center; color: #666; padding: 40px !important; }
    
    .actions { display: flex; gap: 8px; }
    .btn-icon {
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      transition: 0.2s;
    }
    .btn-icon:hover { background: rgba(255,255,255,0.2); }
    .btn-icon.delete:hover { background: var(--primary); }
  `]
})
export class AdminProductsComponent implements OnInit {
  products: any[] = [];
  private apiUrl = 'http://localhost:5300/api/products';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error('Failed to load products', err)
    });
  }

  deleteProduct(id: string) {
    if(confirm('Are you sure you want to delete this product?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => this.loadProducts(),
        error: (err) => console.error('Failed to delete', err)
      });
    }
  }

  openAddModal() {
    alert('Add Product Modal coming soon!');
  }
}
