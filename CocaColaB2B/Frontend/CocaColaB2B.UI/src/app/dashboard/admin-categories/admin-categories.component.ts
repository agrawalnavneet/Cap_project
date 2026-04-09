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
      <button class="btn-primary" (click)="showModal = true; resetForm()">
        <span class="material-symbols-outlined" style="font-size:18px">add</span> Add Category
      </button>
    </div>

    <div class="cards-grid">
      <div *ngFor="let cat of categories" class="cat-card">
        <div class="cat-info">
          <div class="cat-icon-wrap">
            <span class="material-symbols-outlined">category</span>
          </div>
          <div>
            <h3>{{ cat.name }}</h3>
            <p>{{ cat.description || 'No description' }}</p>
            <span class="product-count">{{ cat.productCount }} products</span>
          </div>
        </div>
        <div class="cat-actions">
          <button class="btn-icon" (click)="editCategory(cat)"><span class="material-symbols-outlined">edit</span></button>
          <button class="btn-icon delete" (click)="deleteCategory(cat.id)"><span class="material-symbols-outlined">delete</span></button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()" style="width:420px">
        <h3>{{ editing ? 'Edit Category' : 'New Category' }}</h3>
        <div class="form-group"><label class="form-label">Name</label><input [(ngModel)]="form.name" class="form-input" /></div>
        <div class="form-group"><label class="form-label">Description</label><input [(ngModel)]="form.description" class="form-input" /></div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="showModal = false">Cancel</button>
          <button class="btn-primary" (click)="save()">{{ editing ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .cat-card { background: var(--surface-container-lowest); padding: 24px; border-radius: 16px; box-shadow: var(--shadow-lg); display: flex; justify-content: space-between; align-items: flex-start; transition: transform 0.2s; }
    .cat-card:hover { transform: translateY(-3px); }
    .cat-info { display: flex; gap: 16px; align-items: flex-start; }
    .cat-icon-wrap { width: 44px; height: 44px; border-radius: 12px; background: rgba(79,70,229,0.08); display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0; }
    .cat-icon-wrap .material-symbols-outlined { font-size: 22px; }
    .cat-card h3 { margin: 0 0 6px; font-size: 1rem; font-weight: 700; color: var(--on-surface); }
    .cat-card p { color: var(--on-surface-variant); font-size: 0.85rem; margin: 0 0 10px; }
    .product-count { font-size: 0.7rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .cat-actions { display: flex; gap: 8px; }
    .btn-icon { background: var(--surface-container-low); border: none; color: var(--on-surface-variant); width: 36px; height: 36px; border-radius: 10px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
    .btn-icon .material-symbols-outlined { font-size: 18px; }
    .btn-icon:hover { background: var(--surface-container-high); color: var(--primary); }
    .btn-icon.delete:hover { background: rgba(186,26,26,0.08); color: var(--error); }
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
    if (this.editing) { this.api.updateCategory(this.editing.id, this.form).subscribe(() => { this.showModal = false; this.load(); }); }
    else { this.api.createCategory(this.form).subscribe(() => { this.showModal = false; this.load(); }); }
  }
  deleteCategory(id: string) { if (confirm('Delete this category?')) this.api.deleteCategory(id).subscribe(() => this.load()); }
}
