import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Category } from '../../models/models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>Categories</h2>
      <button class="btn-primary" (click)="showModal = true; resetForm()">+ Add Category</button>
    </div>

    <div class="cards-grid">
      <div *ngFor="let cat of categories" class="cat-card glass-panel">
        <div class="cat-info">
          <h3>{{ cat.name }}</h3>
          <p>{{ cat.description || 'No description' }}</p>
          <span class="product-count">{{ cat.productCount }} products</span>
        </div>
        <div class="cat-actions">
          <button class="btn-icon" (click)="editCategory(cat)">✎</button>
          <button class="btn-icon delete" (click)="deleteCategory(cat.id)">🗑</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal glass-panel" (click)="$event.stopPropagation()">
        <h3>{{ editing ? 'Edit Category' : 'New Category' }}</h3>
        <div class="form-group"><label>Name</label><input [(ngModel)]="form.name" class="form-input" /></div>
        <div class="form-group"><label>Description</label><input [(ngModel)]="form.description" class="form-input" /></div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="showModal = false">Cancel</button>
          <button class="btn-primary" (click)="save()">{{ editing ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .cat-card { padding: 24px; border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: flex-start; transition: transform 0.2s; }
    .cat-card:hover { transform: translateY(-2px); }
    .cat-card h3 { margin: 0 0 8px; font-size: 1.1rem; }
    .cat-card p { color: rgba(255,255,255,0.4); font-size: 0.85rem; margin: 0 0 12px; }
    .product-count { font-size: 0.8rem; color: var(--primary); font-weight: 600; }
    .cat-actions { display: flex; gap: 8px; }
    .btn-icon { background: rgba(255,255,255,0.08); border: none; color: white; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; }
    .btn-icon:hover { background: rgba(255,255,255,0.15); }
    .btn-icon.delete:hover { background: rgba(244,0,9,0.3); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { width: 400px; padding: 32px; border-radius: 16px; background: rgba(26,26,30,0.98); border: 1px solid rgba(255,255,255,0.08); }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
    .form-input { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .btn-primary { padding: 10px 24px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-secondary { padding: 10px 24px; background: rgba(255,255,255,0.08); color: white; border: none; border-radius: 8px; cursor: pointer; }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  showModal = false;
  editing: Category | null = null;
  form: any = {};

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() { this.api.getCategories().subscribe({ next: d => this.categories = d }); }
  resetForm() { this.editing = null; this.form = {}; }
  editCategory(cat: Category) { this.editing = cat; this.form = { ...cat }; this.showModal = true; }

  save() {
    if (this.editing) {
      this.api.updateCategory(this.editing.id, this.form).subscribe(() => { this.showModal = false; this.load(); });
    } else {
      this.api.createCategory(this.form).subscribe(() => { this.showModal = false; this.load(); });
    }
  }

  deleteCategory(id: string) {
    if (confirm('Delete this category?')) this.api.deleteCategory(id).subscribe(() => this.load());
  }
}
