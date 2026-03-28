import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Order, User } from '../../models/models';

@Component({
  selector: 'app-warehouse-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>🏭 Warehouse Dashboard</h2>
    </div>

    <div class="stats-row">
      <div class="stat-card glass-panel">
        <div class="stat-icon pending-icon">⏳</div>
        <div class="stat-content">
          <p>Pending Orders</p>
          <h3>{{ pendingCount }}</h3>
        </div>
      </div>
    </div>

    <div class="admin-panel glass-panel">
      <div class="panel-header">
        <h3>Pending Orders Awaiting Approval</h3>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Wholesaler</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Assign Driver</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of pendingOrders">
              <td>#{{ o.id.substr(0,8) }}</td>
              <td>{{ o.wholesalerName }}</td>
              <td>{{ o.orderDate | date:'medium' }}</td>
              <td>₹{{ o.totalAmount | number:'1.2-2' }}</td>
              <td>
                <select [(ngModel)]="selectedDrivers[o.id]" class="form-input driver-select">
                  <option [ngValue]="null">Select Driver (Optional)</option>
                  <option *ngFor="let d of drivers" [value]="d.id">{{ d.fullName }}</option>
                </select>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-approve" (click)="updateStatus(o.id, 'Approved')">✓ Approve</button>
                  <button class="btn-reject" (click)="updateStatus(o.id, 'Rejected')">✕ Reject</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="pendingOrders.length === 0">
              <td colspan="6" class="text-center empty-state">No pending orders at the moment.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { margin-bottom: 24px; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 30px; }
    .stat-card { padding: 24px; border-radius: 20px; display: flex; align-items: center; gap: 20px; transition: transform 0.3s; }
    .stat-card:hover { transform: translateY(-4px); }
    .stat-icon { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .stat-content p { color: rgba(255,255,255,0.6); font-size: 0.9rem; margin: 0 0 5px 0; font-weight: 500; }
    .stat-content h3 { font-size: 2rem; margin: 0; font-weight: 700; color: white; }
    
    .panel-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .panel-header h3 { margin: 0; font-size: 1.2rem; font-weight: 600; }
    .table-responsive { padding: 0 24px 24px; overflow-x: auto; }
    .data-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
    .data-table th { text-align: left; padding: 12px 16px; color: rgba(255,255,255,0.4); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .data-table td { padding: 16px; background: rgba(26,26,30,0.4); }
    .data-table tbody tr { transition: background-color 0.2s; }
    .data-table tbody tr:hover td { background: rgba(255,255,255,0.03); }
    .data-table td:first-child { border-top-left-radius: 10px; border-bottom-left-radius: 10px; color: var(--primary); font-weight: 500; }
    .data-table td:last-child { border-top-right-radius: 10px; border-bottom-right-radius: 10px; }
    
    .driver-select { padding: 8px 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; width: 100%; font-size: 0.9rem; }
    .action-buttons { display: flex; gap: 8px; }
    .btn-approve { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-approve:hover { background: #10b981; color: white; }
    .btn-reject { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-reject:hover { background: #ef4444; color: white; }
    .text-center { text-align: center; }
    .empty-state { padding: 40px !important; color: rgba(255,255,255,0.4); font-style: italic; }
  `]
})
export class WarehouseManagerComponent implements OnInit {
  orders: Order[] = [];
  pendingOrders: Order[] = [];
  drivers: User[] = [];
  selectedDrivers: { [key: string]: string | null } = {};

  get pendingCount() { return this.pendingOrders.length; }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.getOrders().subscribe(o => {
      this.orders = o;
      this.pendingOrders = o.filter(x => x.status === 'Pending');
      this.pendingOrders.forEach(p => {
        if (!this.selectedDrivers[p.id]) this.selectedDrivers[p.id] = null;
      });
    });
    this.api.getUsers().subscribe(u => {
      this.drivers = u.filter(x => x.role === 'Driver');
    });
  }

  updateStatus(id: string, status: string) {
    const driverId = this.selectedDrivers[id] || undefined;
    if (status === 'Approved' && !driverId) {
      if (!confirm('Are you sure you want to approve this order without assigning a driver? You can assign one later.')) {
        return;
      }
    }
    
this.api.updateOrderStatus(id, { status, driverId }).subscribe(() => {
      this.loadData();
    });
  }
}
