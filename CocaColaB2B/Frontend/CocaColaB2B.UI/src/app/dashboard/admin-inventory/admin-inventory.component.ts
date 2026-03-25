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
      <div class="toggle-group">
        <button [class.active]="showLowStock" (click)="showLowStock = !showLowStock; loadData()">
          {{ showLowStock ? 'Show All' : '⚠️ Low Stock Only' }}
        </button>
      </div>
    </div>

    <div class="table-container glass-panel">
      <table class="premium-table">
        <thead>
          <tr><th>SKU</th><th>Product</th><th>In Stock</th><th>Reorder Level</th><th>Status</th><th>Last Updated</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let inv of inventory" [class.low-stock-row]="inv.isLowStock">
            <td class="mono">{{ inv.productSKU }}</td>
            <td><strong>{{ inv.productName }}</strong></td>
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
            <td>{{ inv.lastUpdated | date:'short' }}</td>
            <td class="actions">
              <button *ngIf="editingId !== inv.productId" class="btn-icon" (click)="startEdit(inv)">✎</button>
              <button *ngIf="editingId === inv.productId" class="btn-icon save" (click)="saveStock(inv)">✓</button>
              <button *ngIf="editingId === inv.productId" class="btn-icon" (click)="editingId = ''">✗</button>
            </td>
          </tr>
          <tr *ngIf="inventory.length === 0"><td colspan="7" class="empty-state">No inventory data</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .toggle-group button { padding: 8px 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; cursor: pointer; transition: 0.2s; }
    .toggle-group button.active { background: rgba(245,158,11,0.2); border-color: #f59e0b; color: #f59e0b; }
    .table-container { padding: 0; overflow: hidden; border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { background: rgba(0,0,0,0.2); padding: 14px 20px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 0.75rem; }
    .premium-table td { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .mono { font-family: monospace; color: rgba(255,255,255,0.6); }
    .low-stock-row { background: rgba(245,158,11,0.05); }
    .stock-badge { padding: 3px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
    .stock-badge.low { background: rgba(244,0,9,0.15); color: var(--primary); }
    .stock-badge.ok { background: rgba(16,185,129,0.15); color: #10b981; }
    .inline-input { width: 80px; padding: 6px 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: white; }
    .actions { display: flex; gap: 8px; }
    .btn-icon { background: rgba(255,255,255,0.08); border: none; color: white; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
    .btn-icon:hover { background: rgba(255,255,255,0.15); }
    .btn-icon.save { color: #10b981; }
    .empty-state { text-align: center; color: rgba(255,255,255,0.3); padding: 40px !important; }
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

  loadData() {
    const obs = this.showLowStock ? this.api.getLowStock() : this.api.getInventory();
    obs.subscribe({ next: (d) => this.inventory = d });
  }

  startEdit(inv: Inventory) {
    this.editingId = inv.productId;
    this.editStock = inv.quantityInStock;
    this.editReorder = inv.reorderLevel;
  }

  saveStock(inv: Inventory) {
    this.api.updateStock(inv.productId, { quantityInStock: this.editStock, reorderLevel: this.editReorder }).subscribe(() => {
      this.editingId = '';
      this.loadData();
    });
  }
}
