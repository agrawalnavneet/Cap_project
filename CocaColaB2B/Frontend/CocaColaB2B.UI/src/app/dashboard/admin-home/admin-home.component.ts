import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { DashboardStats } from '../../models/models';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid">
      <div class="stat-card glass-panel">
        <div class="stat-icon">📦</div>
        <h3>Total Products</h3>
        <p class="stat-value">{{ stats?.totalProducts || 0 }}</p>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-icon">📋</div>
        <h3>Total Orders</h3>
        <p class="stat-value">{{ stats?.totalOrders || 0 }}</p>
      </div>
      <div class="stat-card glass-panel highlight">
        <div class="stat-icon">⏳</div>
        <h3>Pending Orders</h3>
        <p class="stat-value warn">{{ stats?.pendingOrders || 0 }}</p>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-icon">⚠️</div>
        <h3>Low Stock Items</h3>
        <p class="stat-value" [style.color]="(stats?.lowStockItems || 0) > 0 ? 'var(--primary)' : 'white'">{{ stats?.lowStockItems || 0 }}</p>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-icon">💰</div>
        <h3>Total Revenue</h3>
        <p class="stat-value">₹{{ (stats?.totalRevenue || 0) | number:'1.2-2' }}</p>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-icon">👥</div>
        <h3>Total Users</h3>
        <p class="stat-value">{{ stats?.totalUsers || 0 }}</p>
      </div>
    </div>

    <div class="recent-orders glass-panel" style="margin-top: 32px;">
      <h3 style="margin-bottom: 16px;">Recent Orders</h3>
      <table class="premium-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Wholesaler</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of stats?.recentOrders">
            <td class="order-id">{{ order.id.substring(0, 8) }}...</td>
            <td>{{ order.wholesalerName }}</td>
            <td class="price">₹{{ order.totalAmount | number:'1.2-2' }}</td>
            <td><span class="status-tag" [attr.data-status]="order.status">{{ order.status }}</span></td>
            <td>{{ order.orderDate | date:'short' }}</td>
          </tr>
          <tr *ngIf="!stats?.recentOrders?.length">
            <td colspan="5" class="empty-state">No orders yet</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .stat-card { padding: 28px 20px; text-align: center; transition: transform 0.3s ease; background: rgba(26,26,30,0.6); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); position: relative; overflow: hidden; }
    .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--primary) 0%, transparent 100%); opacity: 0; transition: opacity 0.3s; }
    .stat-card:hover { transform: translateY(-4px); }
    .stat-card:hover::before { opacity: 1; }
    .stat-icon { font-size: 1.8rem; margin-bottom: 12px; }
    .stat-card h3 { color: rgba(255,255,255,0.5); font-size: 0.85rem; font-weight: 500; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 2.2rem; font-weight: 700; color: white; margin: 0; }
    .stat-value.warn { color: #f59e0b; }
    .recent-orders { padding: 24px; border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { padding: 12px 16px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .premium-table td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.9rem; }
    .order-id { font-family: monospace; color: rgba(255,255,255,0.6); }
    .price { font-weight: 600; color: #10b981; }
    .status-tag { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; background: rgba(255,255,255,0.08); }
    .status-tag[data-status="Pending"] { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-tag[data-status="Approved"] { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-tag[data-status="Rejected"] { background: rgba(239,68,68,0.15); color: #ef4444; }
    .status-tag[data-status="Delivered"] { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .empty-state { text-align: center; color: rgba(255,255,255,0.3); padding: 32px !important; }
  `]
})
export class AdminHomeComponent implements OnInit {
  stats: DashboardStats | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getDashboardStats().subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error('Failed to load stats', err)
    });
  }
}
