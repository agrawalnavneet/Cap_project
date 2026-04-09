import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SignalRService } from '../../services/signalr.service';
import { Order, User } from '../../models/models';

@Component({
  selector: 'app-warehouse-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>Order Management</h2>
      <div class="live-indicator" *ngIf="isConnected">
        <span class="live-dot"></span> Live
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card" (click)="activeTab = 'all'; applyFilter()">
        <div class="stat-icon-wrap primary-bg"><span class="material-symbols-outlined">receipt_long</span></div>
        <div class="stat-content"><p>Total Orders</p><h3>{{ orders.length }}</h3></div>
      </div>
      <div class="stat-card" [class.active-stat]="activeTab === 'Pending'" (click)="activeTab = 'Pending'; applyFilter()">
        <div class="stat-icon-wrap warning-bg"><span class="material-symbols-outlined">pending_actions</span></div>
        <div class="stat-content"><p>Pending</p><h3>{{ getStatusCount('Pending') }}</h3></div>
        <span class="pulse-badge" *ngIf="newOrderCount > 0">{{ newOrderCount }}</span>
      </div>
      <div class="stat-card" [class.active-stat]="activeTab === 'Approved'" (click)="activeTab = 'Approved'; applyFilter()">
        <div class="stat-icon-wrap success-bg"><span class="material-symbols-outlined">check_circle</span></div>
        <div class="stat-content"><p>Approved</p><h3>{{ getStatusCount('Approved') }}</h3></div>
      </div>
      <div class="stat-card" [class.active-stat]="activeTab === 'OutForDelivery'" (click)="activeTab = 'OutForDelivery'; applyFilter()">
        <div class="stat-icon-wrap tertiary-bg"><span class="material-symbols-outlined">local_shipping</span></div>
        <div class="stat-content"><p>In Transit</p><h3>{{ getStatusCount('OutForDelivery') }}</h3></div>
      </div>
      <div class="stat-card" [class.active-stat]="activeTab === 'Delivered'" (click)="activeTab = 'Delivered'; applyFilter()">
        <div class="stat-icon-wrap delivered-bg"><span class="material-symbols-outlined">package_2</span></div>
        <div class="stat-content"><p>Delivered</p><h3>{{ getStatusCount('Delivered') }}</h3></div>
      </div>
    </div>

    <div class="tab-bar">
      <button [class.active]="activeTab === 'all'" (click)="activeTab = 'all'; applyFilter()">All</button>
      <button [class.active]="activeTab === 'Pending'" (click)="activeTab = 'Pending'; applyFilter()">
        Pending <span class="tab-badge" *ngIf="getStatusCount('Pending') > 0">{{ getStatusCount('Pending') }}</span>
      </button>
      <button [class.active]="activeTab === 'Approved'" (click)="activeTab = 'Approved'; applyFilter()">Approved</button>
      <button [class.active]="activeTab === 'OutForDelivery'" (click)="activeTab = 'OutForDelivery'; applyFilter()">In Transit</button>
      <button [class.active]="activeTab === 'Delivered'" (click)="activeTab = 'Delivered'; applyFilter()">Delivered</button>
      <button [class.active]="activeTab === 'Rejected'" (click)="activeTab = 'Rejected'; applyFilter()">Rejected</button>
    </div>

    <div class="orders-panel">
      <div class="orders-list">
        <div *ngFor="let o of filteredOrders" class="order-row" [class.expanded]="expandedId === o.id">
          <div class="order-summary" (click)="toggleExpand(o.id)">
            <div class="order-id-col">
              <span class="order-id">#{{ o.id.substring(0,8) }}</span>
              <span class="order-date">{{ o.orderDate | date:'medium' }}</span>
            </div>
            <div class="order-who-col">
              <span class="wholesaler-name">{{ o.wholesalerName }}</span>
              <span class="shipping-addr"><span class="material-symbols-outlined addr-icon">location_on</span> {{ o.shippingAddress || 'No address' }}</span>
            </div>
            <div class="order-amount-col">
              <span class="amount">₹{{ o.totalAmount | number:'1.2-2' }}</span>
              <span class="item-count">{{ o.items?.length || 0 }} items</span>
            </div>
            <div class="order-status-col">
              <span class="status-tag" [attr.data-status]="o.status">{{ formatStatus(o.status) }}</span>
            </div>
            <div class="order-expand-col">
              <span class="material-symbols-outlined expand-arrow" [class.rotated]="expandedId === o.id">expand_more</span>
            </div>
          </div>

          <div class="order-detail" *ngIf="expandedId === o.id">
            <div class="timeline-row">
              <div class="timeline-step" [class.active]="isStatusReached(o.status, 'Pending')"><div class="step-dot"></div><span>Placed</span></div>
              <div class="timeline-line" [class.active]="isStatusReached(o.status, 'Approved')"></div>
              <div class="timeline-step" [class.active]="isStatusReached(o.status, 'Approved')"><div class="step-dot"></div><span>Approved</span></div>
              <div class="timeline-line" [class.active]="isStatusReached(o.status, 'OutForDelivery')"></div>
              <div class="timeline-step" [class.active]="isStatusReached(o.status, 'OutForDelivery')"><div class="step-dot"></div><span>In Transit</span></div>
              <div class="timeline-line" [class.active]="isStatusReached(o.status, 'Delivered')"></div>
              <div class="timeline-step" [class.active]="isStatusReached(o.status, 'Delivered')"><div class="step-dot"></div><span>Delivered</span></div>
            </div>

            <div class="items-section">
              <h4>Order Items</h4>
              <div class="item-row" *ngFor="let item of o.items">
                <div class="item-info"><span class="item-name">{{ item.productName }}</span><span class="item-meta">₹{{ item.unitPrice | number:'1.2-2' }} × {{ item.quantity }}</span></div>
                <span class="item-total">₹{{ item.totalPrice | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="action-bar" *ngIf="o.status !== 'Rejected' && o.status !== 'Delivered'">
              <div class="driver-assign" *ngIf="o.status === 'Pending' || (o.status === 'Approved' && !o.driverId)">
                <label>Assign Driver:</label>
                <select [(ngModel)]="selectedDrivers[o.id]" class="form-input driver-select">
                  <option [ngValue]="null">Select a driver</option>
                  <option *ngFor="let d of drivers" [value]="d.id">{{ d.fullName }}</option>
                </select>
              </div>
              <div *ngIf="o.driverName" class="driver-info">
                <span class="material-symbols-outlined" style="font-size:16px">local_shipping</span>
                <span class="driver-name">{{ o.driverName }}</span>
              </div>
              <div class="action-buttons">
                <button *ngIf="o.status === 'Pending'" class="btn-approve" (click)="updateStatus(o.id, 'Approved'); $event.stopPropagation()">
                  <span class="material-symbols-outlined" style="font-size:16px">check</span> Approve
                </button>
                <button *ngIf="o.status === 'Pending'" class="btn-reject" (click)="updateStatus(o.id, 'Rejected'); $event.stopPropagation()">
                  <span class="material-symbols-outlined" style="font-size:16px">close</span> Reject
                </button>
              </div>
            </div>
            <div class="rejected-banner" *ngIf="o.status === 'Rejected'">This order has been rejected</div>
          </div>
        </div>

        <div *ngIf="filteredOrders.length === 0" class="empty-state">
          <span class="material-symbols-outlined empty-icon">receipt_long</span>
          <h3>No {{ activeTab === 'all' ? '' : activeTab }} orders</h3>
          <p>Orders matching this filter will appear here</p>
        </div>
      </div>
    </div>

    <div *ngIf="toastMessage" class="toast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">{{ toastMessage }}</div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .live-indicator { display: flex; align-items: center; gap: 8px; padding: 5px 14px; background: rgba(0,110,47,0.06); border: 1px solid rgba(0,110,47,0.15); border-radius: 20px; font-size: 0.75rem; color: var(--secondary); font-weight: 700; }
    .live-dot { width: 7px; height: 7px; background: var(--secondary); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--surface-container-lowest); padding: 20px; border-radius: 16px; box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 16px; cursor: pointer; transition: all 0.3s; position: relative; }
    .stat-card:hover { transform: translateY(-3px); }
    .stat-card.active-stat { outline: 2px solid var(--primary-container); }
    .stat-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon-wrap .material-symbols-outlined { font-size: 22px; }
    .primary-bg { background: rgba(79,70,229,0.08); color: var(--primary-container); }
    .warning-bg { background: rgba(245,158,11,0.08); color: #b45309; }
    .success-bg { background: rgba(0,110,47,0.08); color: var(--secondary); }
    .tertiary-bg { background: rgba(0,69,152,0.08); color: var(--tertiary); }
    .delivered-bg { background: rgba(79,70,229,0.08); color: var(--primary); }
    .stat-content p { color: var(--on-surface-variant); font-size: 0.75rem; margin: 0 0 4px 0; font-weight: 600; }
    .stat-content h3 { font-size: 1.5rem; margin: 0; font-weight: 700; color: var(--on-surface); font-family: 'Manrope', sans-serif; }
    .pulse-badge { position: absolute; top: -6px; right: -6px; background: var(--error); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; }

    .tab-bar { display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; }
    .tab-bar button { padding: 8px 18px; background: var(--surface-container-lowest); border: 1px solid var(--surface-container-high); border-radius: 10px; color: var(--on-surface-variant); cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: 0.2s; display: flex; align-items: center; gap: 6px; white-space: nowrap; font-family: 'Inter', sans-serif; }
    .tab-bar button:hover { background: var(--surface-container-high); color: var(--on-surface); }
    .tab-bar button.active { background: rgba(79,70,229,0.08); border-color: rgba(79,70,229,0.2); color: var(--primary); }
    .tab-badge { background: var(--primary); color: white; padding: 1px 7px; border-radius: 10px; font-size: 0.65rem; font-weight: 700; }

    .orders-panel { background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; }
    .order-row { border-bottom: 1px solid var(--surface-container-low); transition: 0.2s; }
    .order-row:last-child { border-bottom: none; }
    .order-row:hover { background: var(--surface-container-low); }
    .order-row.expanded { background: var(--surface-container-low); }
    .order-summary { display: grid; grid-template-columns: 1.2fr 2fr 1fr 1fr 40px; align-items: center; padding: 18px 24px; cursor: pointer; gap: 16px; }
    .order-id-col { display: flex; flex-direction: column; gap: 4px; }
    .order-id { font-family: monospace; font-weight: 700; color: var(--primary); font-size: 0.9rem; }
    .order-date { font-size: 0.7rem; color: var(--outline); }
    .order-who-col { display: flex; flex-direction: column; gap: 4px; }
    .wholesaler-name { font-weight: 700; font-size: 0.9rem; color: var(--on-surface); }
    .shipping-addr { font-size: 0.7rem; color: var(--on-surface-variant); display: flex; align-items: center; gap: 2px; }
    .addr-icon { font-size: 14px !important; }
    .order-amount-col { display: flex; flex-direction: column; gap: 4px; text-align: right; }
    .amount { font-weight: 700; font-size: 1.05rem; color: var(--secondary); }
    .item-count { font-size: 0.7rem; color: var(--outline); }
    .order-status-col { text-align: center; }
    .expand-arrow { color: var(--outline); font-size: 20px; transition: transform 0.3s; }
    .expand-arrow.rotated { transform: rotate(180deg); }
    .order-detail { padding: 0 24px 24px; animation: slideDown 0.3s ease; }
    @keyframes slideDown { from { opacity: 0; } to { opacity: 1; } }
    .timeline-row { display: flex; align-items: center; padding: 20px 0; }
    .timeline-step { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 80px; }
    .step-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--surface-container-high); border: 2px solid var(--outline-variant); transition: 0.3s; }
    .timeline-step.active .step-dot { background: var(--secondary); border-color: var(--secondary); box-shadow: 0 0 8px rgba(0,110,47,0.25); }
    .timeline-step span { font-size: 0.65rem; color: var(--outline); text-align: center; }
    .timeline-step.active span { color: var(--secondary); font-weight: 700; }
    .timeline-line { flex: 1; height: 2px; background: var(--outline-variant); }
    .timeline-line.active { background: var(--secondary); }
    .items-section { margin: 16px 0; }
    .items-section h4 { margin-bottom: 12px; font-size: 0.85rem; color: var(--on-surface-variant); font-weight: 700; }
    .item-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--surface-container-low); }
    .item-row:last-child { border-bottom: none; }
    .item-info { display: flex; flex-direction: column; gap: 2px; }
    .item-name { font-size: 0.875rem; font-weight: 500; }
    .item-meta { font-size: 0.75rem; color: var(--on-surface-variant); }
    .item-total { font-weight: 700; color: var(--secondary); }
    .action-bar { display: flex; align-items: center; justify-content: space-between; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--surface-container); flex-wrap: wrap; gap: 16px; }
    .driver-assign { display: flex; align-items: center; gap: 12px; }
    .driver-assign label { font-size: 0.8rem; color: var(--on-surface-variant); font-weight: 600; white-space: nowrap; }
    .driver-select { width: 200px; padding: 8px 12px; }
    .driver-info { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(0,69,152,0.06); border-radius: 10px; color: var(--tertiary); font-weight: 600; font-size: 0.85rem; }
    .driver-name { font-weight: 700; }
    .action-buttons { display: flex; gap: 10px; }
    .btn-approve { background: rgba(0,110,47,0.06); color: var(--secondary); border: 1px solid rgba(0,110,47,0.15); padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; }
    .btn-approve:hover { background: var(--secondary); color: white; }
    .btn-reject { background: rgba(186,26,26,0.06); color: var(--error); border: 1px solid rgba(186,26,26,0.15); padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; }
    .btn-reject:hover { background: var(--error); color: white; }
    .rejected-banner { text-align: center; padding: 16px; margin-top: 16px; background: rgba(186,26,26,0.06); border: 1px solid rgba(186,26,26,0.12); border-radius: 12px; color: var(--error); font-weight: 600; }
    .empty-state { text-align: center; padding: 60px 40px; }
    .empty-icon { font-size: 48px; color: var(--outline-variant); margin-bottom: 12px; }
    .empty-state h3 { margin-bottom: 6px; font-weight: 700; color: var(--on-surface); }
    .empty-state p { color: var(--outline); font-size: 0.875rem; }
  `]
})
export class WarehouseOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  drivers: User[] = [];
  selectedDrivers: { [key: string]: string | null } = {};
  activeTab = 'all';
  expandedId: string | null = null;
  isConnected = false;
  newOrderCount = 0;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private statusOrder = ['Pending', 'Approved', 'OutForDelivery', 'Delivered'];
  private subs: Subscription[] = [];
  constructor(private api: ApiService, private signalR: SignalRService) {}
  ngOnInit() {
    this.loadData(); this.signalR.startConnection();
    this.subs.push(
      this.signalR.connectionState.subscribe(state => { this.isConnected = state === 'connected'; }),
      this.signalR.orderStatusChanged.subscribe(() => { this.loadData(); }),
      this.signalR.newOrderReceived.subscribe(alert => { this.newOrderCount++; this.showToast(`New order from ${alert.wholesalerName} — ₹${alert.totalAmount}`, 'success'); this.loadData(); })
    );
  }
  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
  loadData() {
    this.api.getOrders().subscribe(o => { this.orders = o.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()); this.applyFilter(); this.orders.forEach(p => { if (!this.selectedDrivers[p.id]) this.selectedDrivers[p.id] = null; }); });
    this.api.getUsers().subscribe(u => { this.drivers = u.filter(x => x.role === 'Driver'); });
  }
  applyFilter() { this.filteredOrders = this.activeTab === 'all' ? [...this.orders] : this.orders.filter(o => o.status === this.activeTab); }
  getStatusCount(status: string): number { return this.orders.filter(o => o.status === status).length; }
  toggleExpand(id: string) { this.expandedId = this.expandedId === id ? null : id; }
  formatStatus(status: string): string { return status === 'OutForDelivery' ? 'In Transit' : status; }
  isStatusReached(current: string, check: string): boolean { return this.statusOrder.indexOf(current) >= this.statusOrder.indexOf(check); }
  updateStatus(id: string, status: string) {
    const driverId = this.selectedDrivers[id] || undefined;
    if (status === 'Approved' && !driverId) { if (!confirm('Approve without assigning a driver?')) return; }
    this.api.updateOrderStatus(id, { status, driverId }).subscribe({ next: () => { this.showToast(`Order ${status.toLowerCase()} successfully`, 'success'); if (this.activeTab === 'Pending') this.newOrderCount = Math.max(0, this.newOrderCount - 1); this.loadData(); }, error: () => this.showToast('Failed to update order status', 'error') });
  }
  showToast(message: string, type: 'success' | 'error') { this.toastMessage = message; this.toastType = type; setTimeout(() => this.toastMessage = '', 3500); }
}
