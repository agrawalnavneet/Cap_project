import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Inventory } from '../../models/models';

@Component({
  selector: 'app-warehouse-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>Warehouse Inventory</h2>
      <div class="header-controls">
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input [(ngModel)]="searchTerm" (input)="filterInventory()" placeholder="Search by product or SKU..." class="form-input search-input" />
        </div>
        <button class="toggle-btn" [class.active]="showLowStock" (click)="showLowStock = !showLowStock; loadData()">
          <span class="material-symbols-outlined" style="font-size:18px">{{ showLowStock ? 'list' : 'warning' }}</span>
          {{ showLowStock ? 'Show All' : 'Low Stock' }}
        </button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon-wrap primary-bg"><span class="material-symbols-outlined">inventory_2</span></div>
        <div class="stat-content"><p>Total Products</p><h3>{{ allInventory.length }}</h3></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrap warning-bg"><span class="material-symbols-outlined">warning</span></div>
        <div class="stat-content"><p>Low Stock</p><h3 class="warn">{{ lowStockCount }}</h3></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrap success-bg"><span class="material-symbols-outlined">check_circle</span></div>
        <div class="stat-content"><p>In Stock</p><h3 class="good">{{ allInventory.length - lowStockCount }}</h3></div>
      </div>
    </div>

    <div class="inventory-grid">
      <div *ngFor="let inv of filteredInventory" class="inv-card" [class.low-stock]="inv.isLowStock">
        <div class="inv-header">
          <span class="sku">{{ inv.productSKU }}</span>
          <span class="stock-badge" [class.low]="inv.isLowStock" [class.ok]="!inv.isLowStock">
            {{ inv.isLowStock ? 'LOW STOCK' : 'IN STOCK' }}
          </span>
        </div>
        <div class="inv-body">
          <h3>{{ inv.productName }}</h3>
          <div class="stock-visual">
            <div class="stock-bar-bg">
              <div class="stock-bar-fill" [style.width.%]="getStockPercentage(inv)" [class.low]="inv.isLowStock"></div>
            </div>
            <div class="stock-numbers">
              <span class="qty" [class.warn]="inv.isLowStock">{{ inv.quantityInStock }}</span>
              <span class="reorder">/ {{ inv.reorderLevel }} reorder level</span>
            </div>
          </div>
        </div>
        <div class="inv-footer">
          <span class="updated">Updated: {{ inv.lastUpdated | date:'short' }}</span>
        </div>
      </div>
    </div>

    <div *ngIf="filteredInventory.length === 0" class="empty-state">
      <span class="material-symbols-outlined empty-icon">inventory_2</span>
      <h3>No inventory items found</h3>
      <p>{{ searchTerm ? 'Try a different search term' : 'Inventory data will appear here' }}</p>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .header-controls { display: flex; gap: 12px; align-items: center; }
    .search-box { position: relative; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 20px; color: var(--outline); }
    .search-input { width: 260px; padding: 10px 16px 10px 40px; }
    .toggle-btn { padding: 10px 18px; background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: 10px; color: var(--on-surface-variant); cursor: pointer; font-weight: 600; transition: 0.2s; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; }
    .toggle-btn.active { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.25); color: #b45309; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: var(--surface-container-lowest); padding: 22px; border-radius: 16px; box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 16px; transition: transform 0.3s; }
    .stat-card:hover { transform: translateY(-3px); }
    .stat-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon-wrap .material-symbols-outlined { font-size: 22px; }
    .primary-bg { background: rgba(0,69,152,0.08); color: var(--tertiary); }
    .warning-bg { background: rgba(245,158,11,0.08); color: #b45309; }
    .success-bg { background: rgba(0,110,47,0.08); color: var(--secondary); }
    .stat-content p { color: var(--on-surface-variant); font-size: 0.75rem; margin: 0 0 4px 0; font-weight: 600; }
    .stat-content h3 { font-size: 1.5rem; margin: 0; font-weight: 700; color: var(--on-surface); font-family: 'Manrope', sans-serif; }
    .stat-content h3.warn { color: #b45309; }
    .stat-content h3.good { color: var(--secondary); }

    .inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .inv-card { background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; transition: all 0.3s; }
    .inv-card:hover { transform: translateY(-3px); }
    .inv-card.low-stock { outline: 1px solid rgba(245,158,11,0.25); }
    .inv-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: var(--surface-container-low); border-bottom: 1px solid var(--surface-container); }
    .sku { font-family: monospace; font-size: 0.75rem; color: var(--outline); }
    .stock-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.5px; }
    .stock-badge.low { background: rgba(245,158,11,0.1); color: #b45309; }
    .stock-badge.ok { background: rgba(0,110,47,0.08); color: var(--secondary); }
    .inv-body { padding: 20px; }
    .inv-body h3 { margin: 0 0 16px 0; font-size: 1rem; font-weight: 700; color: var(--on-surface); }
    .stock-bar-bg { width: 100%; height: 8px; background: var(--surface-container-high); border-radius: 4px; overflow: hidden; margin-bottom: 10px; }
    .stock-bar-fill { height: 100%; background: var(--secondary); border-radius: 4px; transition: width 0.5s ease; min-width: 4px; }
    .stock-bar-fill.low { background: linear-gradient(90deg, var(--error), #f59e0b); }
    .stock-numbers { display: flex; align-items: baseline; gap: 6px; }
    .qty { font-size: 1.5rem; font-weight: 700; color: var(--on-surface); font-family: 'Manrope', sans-serif; }
    .qty.warn { color: #b45309; }
    .reorder { font-size: 0.75rem; color: var(--outline); }
    .inv-footer { padding: 12px 20px; border-top: 1px solid var(--surface-container-low); }
    .updated { font-size: 0.7rem; color: var(--outline); }

    .empty-state { text-align: center; padding: 60px 40px; margin-top: 16px; }
    .empty-icon { font-size: 48px; color: var(--outline-variant); margin-bottom: 12px; }
    .empty-state h3 { margin-bottom: 6px; font-weight: 700; }
    .empty-state p { color: var(--outline); font-size: 0.875rem; }
  `]
})
export class WarehouseInventoryComponent implements OnInit {
  allInventory: Inventory[] = [];
  filteredInventory: Inventory[] = [];
  showLowStock = false;
  searchTerm = '';
  get lowStockCount(): number { return this.allInventory.filter(i => i.isLowStock).length; }
  constructor(private api: ApiService) {}
  ngOnInit() { this.loadData(); }
  loadData() { const obs = this.showLowStock ? this.api.getLowStock() : this.api.getInventory(); obs.subscribe({ next: (data) => { this.allInventory = data; this.filterInventory(); } }); }
  filterInventory() { if (!this.searchTerm) { this.filteredInventory = [...this.allInventory]; } else { const term = this.searchTerm.toLowerCase(); this.filteredInventory = this.allInventory.filter(i => i.productName.toLowerCase().includes(term) || i.productSKU.toLowerCase().includes(term)); } }
  getStockPercentage(inv: Inventory): number { const maxDisplay = Math.max(inv.reorderLevel * 3, inv.quantityInStock, 100); return Math.min((inv.quantityInStock / maxDisplay) * 100, 100); }
}
