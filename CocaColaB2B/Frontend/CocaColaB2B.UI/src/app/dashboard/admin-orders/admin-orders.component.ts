import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SignalRService } from '../../services/signalr.service';
import { Order, User } from '../../models/models';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <div class="header-left">
        <h2>Orders Orchestration</h2>
        <div class="live-indicator" *ngIf="isConnected">
          <span class="live-dot"></span> Live
        </div>
      </div>
      <div class="filters">
        <select [(ngModel)]="statusFilter" (change)="applyFilter()" class="form-input filter-select">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="OutForDelivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>
    </div>

    <div class="summary-stats">
      <div class="mini-stat">
        <span class="mini-label">Total</span>
        <span class="mini-value">{{ orders.length }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Pending</span>
        <span class="mini-value pending">{{ getCount('Pending') }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Approved</span>
        <span class="mini-value approved">{{ getCount('Approved') }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">In Transit</span>
        <span class="mini-value transit">{{ getCount('OutForDelivery') }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Delivered</span>
        <span class="mini-value delivered">{{ getCount('Delivered') }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Revenue</span>
        <span class="mini-value revenue">₹{{ totalRevenue | number:'1.0-0' }}</span>
      </div>
    </div>

    <div class="table-container">
      <table class="premium-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Wholesaler</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of filteredOrders" [class.flash-row]="flashingId === order.id">
            <td class="mono clickable" (click)="openDetail(order)">{{ order.id.substring(0,8) }}</td>
            <td class="font-medium">{{ order.wholesalerName }}</td>
            <td>{{ order.items?.length || 0 }}</td>
            <td class="price">₹{{ order.totalAmount | number:'1.2-2' }}</td>
            <td><span class="status-tag" [attr.data-status]="order.status">{{ formatStatus(order.status) }}</span></td>
            <td class="text-muted">{{ order.orderDate | date:'short' }}</td>
            <td class="actions">
              <button *ngIf="order.status === 'Pending'" class="btn-small approve" (click)="updateStatus(order, 'Approved')">
                <span class="material-symbols-outlined btn-icon">check</span> Approve
              </button>
              <button *ngIf="order.status === 'Pending'" class="btn-small reject" (click)="updateStatus(order, 'Rejected')">
                <span class="material-symbols-outlined btn-icon">close</span> Reject
              </button>
              <button *ngIf="order.status === 'Approved' && !order.driverId" class="btn-small assign" (click)="openAssignDriver(order)">
                <span class="material-symbols-outlined btn-icon">local_shipping</span> Assign
              </button>
              <button class="btn-small detail" (click)="openDetail(order)">
                <span class="material-symbols-outlined btn-icon">visibility</span>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredOrders.length === 0"><td colspan="7" class="empty-state">No orders found</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Order Detail Modal -->
    <div class="modal-overlay" *ngIf="showDetailModal" (click)="showDetailModal = false">
      <div class="modal detail-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Order #{{ selectedOrder?.id?.substring(0,8) }}</h3>
          <button class="btn-close" (click)="showDetailModal = false">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="detail-body" *ngIf="selectedOrder">
          <div class="detail-timeline">
            <div class="tl-step" [class.active]="isStatusReached(selectedOrder.status, 'Pending')">
              <div class="tl-dot"></div><span>Placed</span>
            </div>
            <div class="tl-line" [class.active]="isStatusReached(selectedOrder.status, 'Approved')"></div>
            <div class="tl-step" [class.active]="isStatusReached(selectedOrder.status, 'Approved')">
              <div class="tl-dot"></div><span>Approved</span>
            </div>
            <div class="tl-line" [class.active]="isStatusReached(selectedOrder.status, 'OutForDelivery')"></div>
            <div class="tl-step" [class.active]="isStatusReached(selectedOrder.status, 'OutForDelivery')">
              <div class="tl-dot"></div><span>In Transit</span>
            </div>
            <div class="tl-line" [class.active]="isStatusReached(selectedOrder.status, 'Delivered')"></div>
            <div class="tl-step" [class.active]="isStatusReached(selectedOrder.status, 'Delivered')">
              <div class="tl-dot"></div><span>Delivered</span>
            </div>
          </div>
          <div class="detail-grid">
            <div class="detail-cell"><span class="cell-label">Wholesaler</span><span class="cell-value">{{ selectedOrder.wholesalerName }}</span></div>
            <div class="detail-cell"><span class="cell-label">Order Date</span><span class="cell-value">{{ selectedOrder.orderDate | date:'medium' }}</span></div>
            <div class="detail-cell"><span class="cell-label">Shipping Address</span><span class="cell-value">{{ selectedOrder.shippingAddress || 'N/A' }}</span></div>
            <div class="detail-cell"><span class="cell-label">Driver</span><span class="cell-value">{{ selectedOrder.driverName || 'Not assigned' }}</span></div>
          </div>
          <div class="detail-items">
            <h4>Items ({{ selectedOrder.items?.length || 0 }})</h4>
            <div class="d-item" *ngFor="let item of selectedOrder.items">
              <span class="d-item-name">{{ item.productName }}</span>
              <span class="d-item-qty">×{{ item.quantity }}</span>
              <span class="d-item-price">₹{{ item.totalPrice | number:'1.2-2' }}</span>
            </div>
            <div class="d-total"><span>Total</span><span>₹{{ selectedOrder.totalAmount | number:'1.2-2' }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Driver Modal -->
    <div class="modal-overlay" *ngIf="showAssignModal" (click)="showAssignModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Assign Driver</h3>
        <div class="form-group">
          <label class="form-label">Select Driver</label>
          <select [(ngModel)]="selectedDriverId" class="form-input">
            <option value="" disabled>Choose a driver...</option>
            <option *ngFor="let d of drivers" [value]="d.id">{{ d.fullName }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="showAssignModal = false">Cancel</button>
          <button class="btn-primary" (click)="assignDriver()" [disabled]="!selectedDriverId">Assign</button>
        </div>
      </div>
    </div>

    <div *ngIf="toastMessage" class="toast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">{{ toastMessage }}</div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .live-indicator { display: flex; align-items: center; gap: 8px; padding: 5px 14px; background: rgba(0,110,47,0.06); border: 1px solid rgba(0,110,47,0.15); border-radius: 20px; font-size: 0.75rem; color: var(--secondary); font-weight: 700; }
    .live-dot { width: 7px; height: 7px; background: var(--secondary); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .filter-select { width: 180px; padding: 10px 14px; border-radius: 10px; }

    .summary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .mini-stat { background: var(--surface-container-lowest); padding: 18px; border-radius: 14px; text-align: center; box-shadow: var(--shadow-lg); transition: transform 0.2s; }
    .mini-stat:hover { transform: translateY(-2px); }
    .mini-label { display: block; font-size: 0.65rem; font-weight: 700; color: var(--on-surface-variant); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
    .mini-value { font-size: 1.5rem; font-weight: 700; color: var(--on-surface); font-family: 'Manrope', sans-serif; }
    .mini-value.pending { color: #b45309; }
    .mini-value.approved { color: var(--secondary); }
    .mini-value.transit { color: var(--tertiary); }
    .mini-value.delivered { color: var(--primary); }
    .mini-value.revenue { color: var(--secondary); font-size: 1.15rem; }

    .table-container { background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; }
    .mono { font-family: monospace; color: var(--on-surface-variant); }
    .clickable { cursor: pointer; }
    .clickable:hover { color: var(--primary); }
    .font-medium { font-weight: 600; }
    .price { font-weight: 700; color: var(--secondary); }
    .text-muted { color: var(--on-surface-variant); }
    .actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn-small { padding: 6px 14px; border: none; border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 4px; }
    .btn-icon { font-size: 14px !important; }
    .btn-small.approve { background: rgba(0,110,47,0.08); color: var(--secondary); }
    .btn-small.approve:hover { background: rgba(0,110,47,0.15); }
    .btn-small.reject { background: rgba(186,26,26,0.08); color: var(--error); }
    .btn-small.reject:hover { background: rgba(186,26,26,0.15); }
    .btn-small.assign { background: rgba(0,69,152,0.08); color: var(--tertiary); }
    .btn-small.assign:hover { background: rgba(0,69,152,0.15); }
    .btn-small.detail { background: rgba(79,70,229,0.08); color: var(--primary); }
    .btn-small.detail:hover { background: rgba(79,70,229,0.15); }
    .empty-state { text-align: center; color: var(--outline); padding: 40px !important; }
    .flash-row { animation: rowFlash 1s ease; }
    @keyframes rowFlash { 0%, 100% { background: transparent; } 50% { background: rgba(0,110,47,0.06); } }

    .detail-modal { width: 620px; max-height: 80vh; overflow-y: auto; padding: 0; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px; border-bottom: 1px solid var(--surface-container); }
    .modal-header h3 { margin: 0; font-size: 1.1rem; }
    .btn-close { background: none; border: none; color: var(--outline); cursor: pointer; padding: 4px; border-radius: 8px; transition: 0.2s; display: flex; }
    .btn-close:hover { background: var(--surface-container-high); color: var(--on-surface); }
    .detail-body { padding: 24px 28px; }
    .detail-timeline { display: flex; align-items: center; margin-bottom: 24px; }
    .tl-step { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 70px; }
    .tl-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--surface-container-high); border: 2px solid var(--outline-variant); transition: 0.3s; }
    .tl-step.active .tl-dot { background: var(--secondary); border-color: var(--secondary); box-shadow: 0 0 8px rgba(0,110,47,0.25); }
    .tl-step span { font-size: 0.65rem; color: var(--outline); }
    .tl-step.active span { color: var(--secondary); font-weight: 700; }
    .tl-line { flex: 1; height: 2px; background: var(--outline-variant); }
    .tl-line.active { background: var(--secondary); }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .cell-label { display: block; font-size: 0.65rem; font-weight: 700; color: var(--on-surface-variant); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .cell-value { font-size: 0.9rem; font-weight: 500; color: var(--on-surface); }
    .detail-items { border-top: 1px solid var(--surface-container); padding-top: 20px; }
    .detail-items h4 { margin-bottom: 14px; font-size: 0.875rem; color: var(--on-surface-variant); }
    .d-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--surface-container-low); }
    .d-item:last-of-type { border-bottom: none; }
    .d-item-name { flex: 1; font-size: 0.875rem; }
    .d-item-qty { color: var(--on-surface-variant); font-size: 0.85rem; }
    .d-item-price { font-weight: 700; color: var(--secondary); }
    .d-total { display: flex; justify-content: space-between; padding: 16px 0 0; border-top: 1px solid var(--surface-container-high); font-size: 1.1rem; font-weight: 700; margin-top: 12px; }
  `]
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  statusFilter = '';
  drivers: User[] = [];
  showAssignModal = false;
  showDetailModal = false;
  selectedOrderId = '';
  selectedDriverId = '';
  selectedOrder: Order | null = null;
  isConnected = false;
  flashingId: string | null = null;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  private statusOrder = ['Pending', 'Approved', 'OutForDelivery', 'Delivered'];
  private subs: Subscription[] = [];

  get totalRevenue(): number {
    return this.orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.totalAmount, 0);
  }

  constructor(private api: ApiService, private signalR: SignalRService) {}

  ngOnInit() {
    this.loadOrders();
    this.api.getUsers().subscribe(users => this.drivers = users.filter(u => u.role === 'Driver'));
    this.signalR.startConnection();
    this.subs.push(
      this.signalR.connectionState.subscribe(state => { this.isConnected = state === 'connected'; }),
      this.signalR.orderStatusChanged.subscribe(update => {
        this.flashingId = update.orderId;
        setTimeout(() => this.flashingId = null, 1500);
        this.loadOrders();
      }),
      this.signalR.newOrderReceived.subscribe(() => { this.loadOrders(); })
    );
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  loadOrders() {
    this.api.getOrders().subscribe({ next: (d) => { this.orders = d.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()); this.applyFilter(); } });
  }

  applyFilter() { this.filteredOrders = this.statusFilter ? this.orders.filter(o => o.status === this.statusFilter) : [...this.orders]; }
  getCount(status: string): number { return this.orders.filter(o => o.status === status).length; }
  formatStatus(status: string): string { return status === 'OutForDelivery' ? 'In Transit' : status; }
  isStatusReached(current: string, check: string): boolean { return this.statusOrder.indexOf(current) >= this.statusOrder.indexOf(check); }

  updateStatus(order: Order, status: string) {
    this.api.updateOrderStatus(order.id, { status }).subscribe({
      next: () => { this.showToast(`Order ${status.toLowerCase()} successfully`, 'success'); this.loadOrders(); },
      error: () => this.showToast('Failed to update status', 'error')
    });
  }

  openAssignDriver(order: Order) { this.selectedOrderId = order.id; this.selectedDriverId = ''; this.showAssignModal = true; }

  assignDriver() {
    this.api.updateOrderStatus(this.selectedOrderId, { status: 'Approved', driverId: this.selectedDriverId }).subscribe({
      next: () => { this.showAssignModal = false; this.showToast('Driver assigned successfully', 'success'); this.loadOrders(); },
      error: () => this.showToast('Failed to assign driver', 'error')
    });
  }

  openDetail(order: Order) { this.selectedOrder = order; this.showDetailModal = true; }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message; this.toastType = type;
    setTimeout(() => this.toastMessage = '', 3500);
  }
}
