import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SignalRService } from '../../services/signalr.service';
import { Order } from '../../models/models';

@Component({
  selector: 'app-wholesaler-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header-actions">
      <h2>My Orders</h2>
      <div class="header-right">
        <div class="live-indicator" *ngIf="isConnected"><span class="live-dot"></span> Live Tracking</div>
        <span class="order-count">{{ orders.length }} Orders</span>
      </div>
    </div>

    <div class="filter-tabs">
      <button [class.active]="filterTab === 'all'" (click)="filterTab = 'all'; applyFilter()">All <span class="tab-count">{{ orders.length }}</span></button>
      <button [class.active]="filterTab === 'active'" (click)="filterTab = 'active'; applyFilter()">Active <span class="tab-count">{{ activeOrderCount }}</span></button>
      <button [class.active]="filterTab === 'Delivered'" (click)="filterTab = 'Delivered'; applyFilter()">Delivered <span class="tab-count">{{ deliveredCount }}</span></button>
    </div>

    <div *ngIf="filteredOrders.length === 0" class="empty-state">
      <span class="material-symbols-outlined empty-icon">receipt_long</span>
      <h3>No orders {{ filterTab === 'all' ? 'yet' : 'found' }}</h3>
      <p>{{ filterTab === 'all' ? 'Your order history will appear here' : 'No orders match this filter' }}</p>
    </div>

    <div class="orders-list">
      <div *ngFor="let order of filteredOrders; trackBy: trackById" class="order-card" [class.status-update-flash]="flashingOrderId === order.id" (click)="toggleExpand(order.id)">
        <div class="order-header">
          <div class="order-meta">
            <span class="order-id">#{{ order.id.substring(0, 8) }}</span>
            <span class="order-date">{{ order.orderDate | date:'mediumDate' }}</span>
          </div>
          <div class="order-right">
            <span class="order-total">₹{{ order.totalAmount | number:'1.2-2' }}</span>
            <span class="status-tag" [attr.data-status]="order.status">{{ formatStatus(order.status) }}</span>
          </div>
        </div>

        <div class="timeline" *ngIf="expandedId === order.id">
          <div class="timeline-step" [class.active]="isStatusReached(order.status, 'Pending')" [class.current]="order.status === 'Pending'">
            <div class="step-dot"><span class="step-check" *ngIf="isStatusPast(order.status, 'Pending')">✓</span></div>
            <div class="step-label"><span class="step-title">Order Placed</span><span class="step-time">{{ order.orderDate | date:'shortTime' }}</span></div>
          </div>
          <div class="timeline-line" [class.active]="isStatusReached(order.status, 'Approved')"></div>
          <div class="timeline-step" [class.active]="isStatusReached(order.status, 'Approved')" [class.current]="order.status === 'Approved'">
            <div class="step-dot"><span class="step-check" *ngIf="isStatusPast(order.status, 'Approved')">✓</span></div>
            <div class="step-label"><span class="step-title">Approved</span><span class="step-desc" *ngIf="order.status === 'Approved'">Being prepared</span></div>
          </div>
          <div class="timeline-line" [class.active]="isStatusReached(order.status, 'OutForDelivery')"></div>
          <div class="timeline-step" [class.active]="isStatusReached(order.status, 'OutForDelivery')" [class.current]="order.status === 'OutForDelivery'">
            <div class="step-dot"><span class="step-check" *ngIf="isStatusPast(order.status, 'OutForDelivery')">✓</span><span class="transit-pulse" *ngIf="order.status === 'OutForDelivery'"></span></div>
            <div class="step-label"><span class="step-title">Out for Delivery</span><span class="step-desc" *ngIf="order.status === 'OutForDelivery' && order.driverName">{{ order.driverName }}</span></div>
          </div>
          <div class="timeline-line" [class.active]="isStatusReached(order.status, 'Delivered')"></div>
          <div class="timeline-step" [class.active]="isStatusReached(order.status, 'Delivered')" [class.current]="order.status === 'Delivered'">
            <div class="step-dot"><span class="step-check" *ngIf="order.status === 'Delivered'">✓</span></div>
            <div class="step-label"><span class="step-title">Delivered</span></div>
          </div>
          <div *ngIf="order.status === 'Rejected'" class="rejected-notice">❌ This order was rejected</div>
        </div>

        <div class="order-items" *ngIf="expandedId === order.id">
          <div class="item-row" *ngFor="let item of order.items">
            <div class="item-info"><div><span class="item-name">{{ item.productName }}</span><span class="item-qty">×{{ item.quantity }} @ ₹{{ item.unitPrice | number:'1.2-2' }}</span></div></div>
            <span class="item-price">₹{{ item.totalPrice | number:'1.2-2' }}</span>
          </div>
          <div class="order-footer">
            <div class="footer-left"><span class="material-symbols-outlined" style="font-size:14px">location_on</span> {{ order.shippingAddress || 'N/A' }}</div>
            <div class="footer-right">
              <span *ngIf="order.driverName" class="driver-info"><span class="material-symbols-outlined" style="font-size:14px">local_shipping</span> {{ order.driverName }}</span>
            </div>
          </div>
        </div>

        <div class="expand-hint">
          <span class="material-symbols-outlined" style="font-size:16px">{{ expandedId === order.id ? 'expand_less' : 'expand_more' }}</span>
          {{ expandedId === order.id ? 'Collapse' : 'View Details & Track' }}
        </div>
      </div>
    </div>

    <div *ngIf="toastMessage" class="toast success">{{ toastMessage }}</div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .live-indicator { display: flex; align-items: center; gap: 8px; padding: 5px 14px; background: rgba(0,110,47,0.06); border: 1px solid rgba(0,110,47,0.15); border-radius: 20px; font-size: 0.7rem; color: var(--secondary); font-weight: 700; }
    .live-dot { width: 7px; height: 7px; background: var(--secondary); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .order-count { background: var(--surface-container-lowest); box-shadow: var(--shadow-sm); padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; color: var(--on-surface-variant); font-weight: 600; }
    .filter-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .filter-tabs button { padding: 8px 16px; background: var(--surface-container-lowest); border: 1px solid var(--surface-container-high); border-radius: 10px; color: var(--on-surface-variant); cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: 0.2s; display: flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif; }
    .filter-tabs button:hover { background: var(--surface-container-high); }
    .filter-tabs button.active { background: rgba(79,70,229,0.08); border-color: rgba(79,70,229,0.2); color: var(--primary); }
    .tab-count { font-size: 0.65rem; background: var(--surface-container-high); padding: 1px 8px; border-radius: 10px; }
    .empty-state { text-align: center; padding: 80px 40px; background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); }
    .empty-icon { font-size: 56px; color: var(--outline-variant); margin-bottom: 16px; }
    .empty-state h3 { margin-bottom: 8px; color: var(--on-surface); }
    .empty-state p { color: var(--outline); }
    .orders-list { display: flex; flex-direction: column; gap: 16px; }
    .order-card { padding: 0; border-radius: 16px; cursor: pointer; background: var(--surface-container-lowest); box-shadow: var(--shadow-lg); overflow: hidden; transition: all 0.3s; }
    .order-card:hover { box-shadow: var(--shadow-xl); transform: translateY(-2px); }
    .order-card.status-update-flash { animation: flash 1s ease; }
    @keyframes flash { 0%, 100% { outline: 0; } 50% { outline: 2px solid var(--secondary); box-shadow: 0 0 20px rgba(0,110,47,0.15); } }
    .order-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; }
    .order-meta { display: flex; flex-direction: column; gap: 4px; }
    .order-id { font-family: monospace; font-weight: 700; color: var(--primary); }
    .order-date { font-size: 0.75rem; color: var(--outline); }
    .order-right { display: flex; align-items: center; gap: 16px; }
    .order-total { font-weight: 700; font-size: 1.15rem; color: var(--primary); font-family: 'Manrope', sans-serif; }
    .timeline { display: flex; align-items: flex-start; padding: 24px; gap: 0; border-top: 1px solid var(--surface-container-low); }
    .timeline-step { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 90px; position: relative; }
    .step-dot { width: 22px; height: 22px; border-radius: 50%; background: var(--surface-container-high); border: 2px solid var(--outline-variant); display: flex; align-items: center; justify-content: center; transition: 0.3s; position: relative; }
    .timeline-step.active .step-dot { background: var(--secondary); border-color: var(--secondary); box-shadow: 0 0 10px rgba(0,110,47,0.2); }
    .timeline-step.current .step-dot { animation: currentPulse 2s infinite; }
    @keyframes currentPulse { 0%, 100% { box-shadow: 0 0 10px rgba(0,110,47,0.2); } 50% { box-shadow: 0 0 20px rgba(0,110,47,0.4); } }
    .step-check { color: white; font-size: 0.5rem; font-weight: 800; }
    .transit-pulse { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid var(--tertiary); animation: transitPulse 1.5s infinite; }
    @keyframes transitPulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
    .step-label { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .step-title { font-size: 0.65rem; color: var(--outline); text-align: center; }
    .timeline-step.active .step-title { color: var(--secondary); font-weight: 700; }
    .step-time { font-size: 0.55rem; color: var(--outline-variant); }
    .step-desc { font-size: 0.55rem; color: var(--tertiary); font-weight: 600; }
    .timeline-line { flex: 1; height: 2px; background: var(--outline-variant); margin-top: 11px; }
    .timeline-line.active { background: var(--secondary); }
    .rejected-notice { width: 100%; text-align: center; padding: 10px; background: rgba(186,26,26,0.06); border-radius: 10px; color: var(--error); font-size: 0.85rem; margin-top: 12px; font-weight: 600; }
    .order-items { padding: 0 24px 16px; border-top: 1px solid var(--surface-container-low); }
    .item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--surface-container-low); }
    .item-info { display: flex; align-items: center; gap: 12px; }
    .item-name { font-size: 0.875rem; display: block; font-weight: 500; }
    .item-qty { font-size: 0.75rem; color: var(--on-surface-variant); display: block; }
    .item-price { font-weight: 700; color: var(--secondary); }
    .order-footer { padding: 12px 0 4px; font-size: 0.75rem; color: var(--outline); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; align-items: center; }
    .footer-left { display: flex; align-items: center; gap: 4px; }
    .footer-right { display: flex; align-items: center; gap: 12px; }
    .driver-info { color: var(--tertiary); font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .expand-hint { text-align: center; padding: 10px; font-size: 0.7rem; color: var(--outline); border-top: 1px solid var(--surface-container-low); display: flex; align-items: center; justify-content: center; gap: 4px; font-weight: 600; }
  `]
})
export class WholesalerOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  expandedId: string | null = null;
  filterTab: 'all' | 'active' | 'Delivered' = 'all';
  isConnected = false;
  flashingOrderId: string | null = null;
  toastMessage = '';
  private statusOrder = ['Pending', 'Approved', 'OutForDelivery', 'Delivered'];
  private subs: Subscription[] = [];
  get activeOrderCount(): number { return this.orders.filter(o => o.status !== 'Delivered' && o.status !== 'Rejected').length; }
  get deliveredCount(): number { return this.orders.filter(o => o.status === 'Delivered').length; }
  constructor(private api: ApiService, private signalR: SignalRService) {}
  ngOnInit() {
    this.loadOrders(); this.signalR.startConnection();
    this.subs.push(
      this.signalR.connectionState.subscribe(state => { this.isConnected = state === 'connected'; }),
      this.signalR.orderStatusChanged.subscribe(update => { this.flashingOrderId = update.orderId; setTimeout(() => this.flashingOrderId = null, 1500); this.toastMessage = `Order #${update.orderId.substring(0, 8)} is now: ${this.formatStatus(update.newStatus)}`; setTimeout(() => this.toastMessage = '', 4000); this.loadOrders(); })
    );
  }
  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
  trackById(index: number, item: Order): string { return item.id; }
  loadOrders() { this.api.getOrders().subscribe({ next: (d) => { this.orders = d.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()); this.applyFilter(); }, error: () => this.orders = [] }); }
  applyFilter() { switch (this.filterTab) { case 'active': this.filteredOrders = this.orders.filter(o => o.status !== 'Delivered' && o.status !== 'Rejected'); break; case 'Delivered': this.filteredOrders = this.orders.filter(o => o.status === 'Delivered'); break; default: this.filteredOrders = [...this.orders]; } }
  toggleExpand(id: string) { this.expandedId = this.expandedId === id ? null : id; }
  formatStatus(status: string): string { return status === 'OutForDelivery' ? 'In Transit' : status; }
  isStatusReached(currentStatus: string, checkStatus: string): boolean { return this.statusOrder.indexOf(currentStatus) >= this.statusOrder.indexOf(checkStatus); }
  isStatusPast(currentStatus: string, checkStatus: string): boolean { return this.statusOrder.indexOf(currentStatus) > this.statusOrder.indexOf(checkStatus); }
}
