import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Inventory } from '../../models/models';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>Inventory Management</h2>
      <button class="toggle-btn" [class.active]="showLowStock" (click)="showLowStock = !showLowStock; loadData()">
        <span class="material-symbols-outlined" style="font-size:18px">{{ showLowStock ? 'list' : 'warning' }}</span>
        {{ showLowStock ? 'Show All' : 'Low Stock Only' }}
      </button>
    </div>

    <div class="table-container">
      <table class="premium-table">
        <thead>
          <tr><th>SKU</th><th>Product</th><th>In Stock</th><th>Reorder Level</th><th>Status</th><th>Last Updated</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let inv of inventory" [class.low-stock-row]="inv.isLowStock">
            <td class="mono">{{ inv.productSKU }}</td>
            <td class="font-medium">{{ inv.productName }}</td>
            <td>
              <span *ngIf="editingId !== inv.productId">{{ inv.quantityInStock }}</span>
              <input *ngIf="editingId === inv.productId" [(ngModel)]="editStock" type="number" class="inline-input" />
            </td>
            <td>
              <span *ngIf="editingId !== inv.productId">{{ inv.reorderLevel }}</span>
              <input *ngIf="editingId === inv.productId" [(ngModel)]="editReorder" type="number" class="inline-input" />
            </td>
            <td>
              <span class="stock-badge" [class.low]="inv.isLowStock" [class.ok]="!inv.isLowStock">
                {{ inv.isLowStock ? 'LOW' : 'OK' }}
              </span>
            </td>
            <td class="text-muted">{{ inv.lastUpdated | date:'short' }}</td>
            <td class="actions">
              <button *ngIf="editingId !== inv.productId" class="btn-icon" (click)="startEdit(inv)"><span class="material-symbols-outlined">edit</span></button>
              <button *ngIf="editingId === inv.productId" class="btn-icon save" (click)="saveStock(inv)"><span class="material-symbols-outlined">check</span></button>
              <button *ngIf="editingId === inv.productId" class="btn-icon" (click)="editingId = ''"><span class="material-symbols-outlined">close</span></button>
            </td>
          </tr>
          <tr *ngIf="inventory.length === 0"><td colspan="7" class="empty-state">No inventory data</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .toggle-btn { padding: 10px 18px; background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: 10px; color: var(--on-surface-variant); cursor: pointer; font-weight: 600; transition: 0.2s; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
    .toggle-btn.active { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.3); color: #b45309; }
    .table-container { background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; }
    .mono { font-family: monospace; color: var(--on-surface-variant); }
    .font-medium { font-weight: 600; }
    .text-muted { color: var(--on-surface-variant); }
    .low-stock-row { background: rgba(245,158,11,0.04); }
    .stock-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.5px; }
    .stock-badge.low { background: rgba(186,26,26,0.08); color: var(--error); }
    .stock-badge.ok { background: rgba(0,110,47,0.08); color: var(--secondary); }
    .inline-input { width: 80px; padding: 8px 10px; background: var(--surface-container-low); border: 1px solid var(--outline-variant); border-radius: 8px; color: var(--on-surface); font-size: 0.875rem; }
    .inline-input:focus { outline: none; border-color: var(--primary); }
    .actions { display: flex; gap: 8px; }
    .btn-icon { background: var(--surface-container-low); border: none; color: var(--on-surface-variant); width: 36px; height: 36px; border-radius: 10px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
    .btn-icon .material-symbols-outlined { font-size: 18px; }
    .btn-icon:hover { background: var(--surface-container-high); color: var(--primary); }
    .btn-icon.save { color: var(--secondary); }
    .btn-icon.save:hover { background: rgba(0,110,47,0.08); }
    .empty-state { text-align: center; color: var(--outline); padding: 40px !important; }
  `]
})
export class AdminInventoryComponent implements OnInit {
  inventory: Inventory[] = [];
  showLowStock = false;
  editingId = '';
  editStock = 0;
  editReorder = 0;
  constructor(private api: ApiService) {}
  ngOnInit() { this.loadData(); }
  loadData() { const obs = this.showLowStock ? this.api.getLowStock() : this.api.getInventory(); obs.subscribe({ next: (d) => this.inventory = d }); }
  startEdit(inv: Inventory) { this.editingId = inv.productId; this.editStock = inv.quantityInStock; this.editReorder = inv.reorderLevel; }
  saveStock(inv: Inventory) { this.api.updateStock(inv.productId, { quantityInStock: this.editStock, reorderLevel: this.editReorder }).subscribe(() => { this.editingId = ''; this.loadData(); }); }
}
