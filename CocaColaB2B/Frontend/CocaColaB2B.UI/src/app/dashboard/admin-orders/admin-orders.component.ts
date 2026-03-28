import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Order, User } from '../../models/models';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>All Orders</h2>
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

    <div class="table-container glass-panel">
      <table class="premium-table">
        <thead>
          <tr><th>Order ID</th><th>Wholesaler</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of filteredOrders">
            <td class="mono">{{ order.id.substring(0,8) }}</td>
            <td>{{ order.wholesalerName }}</td>
            <td class="price">₹{{ order.totalAmount | number:'1.2-2' }}</td>
            <td><span class="status-tag" [attr.data-status]="order.status">{{ order.status }}</span></td>
            <td>{{ order.orderDate | date:'short' }}</td>
            <td class="actions">
              <button *ngIf="order.status === 'Pending'" class="btn-small approve" (click)="updateStatus(order, 'Approved')">✓ Approve</button>
              <button *ngIf="order.status === 'Pending'" class="btn-small reject" (click)="updateStatus(order, 'Rejected')">✗ Reject</button>
              <button *ngIf="order.status === 'Approved'" class="btn-small assign" (click)="openAssignDriver(order)">🚚 Assign</button>
            </td>
          </tr>
          <tr *ngIf="filteredOrders.length === 0"><td colspan="6" class="empty-state">No orders found</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Assign Driver Modal -->
    <div class="modal-overlay" *ngIf="showAssignModal" (click)="showAssignModal = false">
      <div class="modal glass-panel" (click)="$event.stopPropagation()">
        <h3>Assign Driver</h3>
        <div class="form-group">
          <label>Select Driver</label>
          <select [(ngModel)]="selectedDriverId" class="form-input">
            <option *ngFor="let d of drivers" [value]="d.id">{{ d.fullName }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="showAssignModal = false">Cancel</button>
          <button class="btn-primary" (click)="assignDriver()">Assign</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .filter-select { width: 180px; padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; }
    .table-container { padding: 0; overflow: hidden; border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { background: rgba(0,0,0,0.2); padding: 14px 20px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 0.75rem; }
    .premium-table td { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .mono { font-family: monospace; color: rgba(255,255,255,0.6); }
    .price { font-weight: 600; color: #10b981; }
    .status-tag { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: rgba(255,255,255,0.08); }
    .status-tag[data-status="Pending"] { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-tag[data-status="Approved"] { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-tag[data-status="Rejected"] { background: rgba(239,68,68,0.15); color: #ef4444; }
    .status-tag[data-status="OutForDelivery"] { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .status-tag[data-status="Delivered"] { background: rgba(139,92,246,0.15); color: #8b5cf6; }
    .actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn-small { padding: 6px 12px; border: none; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-small.approve { background: rgba(16,185,129,0.15); color: #10b981; }
    .btn-small.approve:hover { background: rgba(16,185,129,0.3); }
    .btn-small.reject { background: rgba(239,68,68,0.15); color: #ef4444; }
    .btn-small.reject:hover { background: rgba(239,68,68,0.3); }
    .btn-small.assign { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .btn-small.assign:hover { background: rgba(59,130,246,0.3); }
    .empty-state { text-align: center; color: rgba(255,255,255,0.3); padding: 40px !important; }
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
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  statusFilter = '';
  drivers: User[] = [];
  showAssignModal = false;
  selectedOrderId = '';
  selectedDriverId = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadOrders();
    this.api.getUsers().subscribe(users => this.drivers = users.filter(u => u.role === 'Driver'));
  }

  loadOrders() {
    this.api.getOrders().subscribe({ next: (d) => { this.orders = d; this.applyFilter(); } });
  }

  applyFilter() {
    this.filteredOrders = this.statusFilter ? this.orders.filter(o => o.status === this.statusFilter) : [...this.orders];
  }

  updateStatus(order: Order, status: string) {
    this.api.updateOrderStatus(order.id, { status }).subscribe(() => this.loadOrders());
  }

  openAssignDriver(order: Order) {
    this.selectedOrderId = order.id;
    this.showAssignModal = true;
  }

  assignDriver() {
    this.api.updateOrderStatus(this.selectedOrderId, { status: 'Approved', driverId: this.selectedDriverId }).subscribe(() => {
      this.showAssignModal = false;
      this.loadOrders();
    });
  }
}
