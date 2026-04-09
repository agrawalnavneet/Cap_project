import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signalr.service';
import { DashboardStats } from '../../models/models';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Header Section -->
    <div class="dash-header">
      <div>
        <h2 class="dash-title">{{ dashTitle }}</h2>
        <p class="dash-subtitle">Monitoring real-time flow across <span class="highlight">{{ stats?.totalUsers || 0 }} active users</span></p>
      </div>
      <button class="btn-generate" *ngIf="userRole === 'Admin'">
        <span class="material-symbols-outlined">add_circle</span>
        Generate Report
      </button>
    </div>

    <!-- Access Notice for non-admin users -->
    <div *ngIf="accessNotice" class="access-notice">
      <span class="material-symbols-outlined">info</span>
      {{ accessNotice }}
    </div>

    <!-- Bento KPI Grid -->
    <div class="kpi-grid" *ngIf="stats">
      <!-- KPI 1: Total Orders -->
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-icon-wrap kpi-primary">
            <span class="material-symbols-outlined">shopping_cart</span>
          </div>
          <span class="kpi-trend positive">+12.5%</span>
        </div>
        <div class="kpi-bottom">
          <p class="kpi-value">{{ stats?.totalOrders || 0 }}</p>
          <p class="kpi-label">Total Orders</p>
        </div>
        <div class="kpi-watermark">
          <span class="material-symbols-outlined">shopping_cart</span>
        </div>
      </div>

      <!-- KPI 2: Revenue -->
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-icon-wrap kpi-tertiary">
            <span class="material-symbols-outlined">payments</span>
          </div>
          <span class="kpi-trend positive">+8.2%</span>
        </div>
        <div class="kpi-bottom">
          <p class="kpi-value">₹{{ (stats?.totalRevenue || 0) | number:'1.0-0' }}</p>
          <p class="kpi-label">Revenue</p>
        </div>
        <div class="kpi-watermark">
          <span class="material-symbols-outlined">payments</span>
        </div>
      </div>

      <!-- KPI 3: Total Users -->
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-icon-wrap kpi-secondary">
            <span class="material-symbols-outlined">groups</span>
          </div>
          <span class="kpi-trend neutral">Stable</span>
        </div>
        <div class="kpi-bottom">
          <p class="kpi-value">{{ stats?.totalUsers || 0 }}</p>
          <p class="kpi-label">Active Users</p>
        </div>
        <div class="kpi-watermark">
          <span class="material-symbols-outlined">groups</span>
        </div>
      </div>

      <!-- KPI 4: Pending Approvals -->
      <div class="kpi-card kpi-alert">
        <div class="kpi-top">
          <div class="kpi-icon-wrap kpi-error">
            <span class="material-symbols-outlined">priority_high</span>
          </div>
          <span class="kpi-trend danger">Action Required</span>
        </div>
        <div class="kpi-bottom">
          <p class="kpi-value">{{ stats?.pendingOrders || 0 }}</p>
          <p class="kpi-label">Pending Approvals</p>
        </div>
      </div>
    </div>

    <!-- Charts + Leaderboard Row -->
    <div class="charts-row" *ngIf="stats">
      <!-- Daily Order Volume (Bar Chart) -->
      <div class="chart-area">
        <div class="chart-header">
          <div>
            <h3 class="chart-title">Daily Order Volume</h3>
            <p class="chart-sub">Real-time throughput for last 7 days</p>
          </div>
          <div class="chart-tabs">
            <button class="chart-tab active">Weekly</button>
            <button class="chart-tab">Monthly</button>
          </div>
        </div>
        <div class="bar-chart">
          <div class="bar-group" *ngFor="let bar of chartBars">
            <div class="bar"
              [style.height]="bar.height"
              [class.bar-highlight]="bar.highlight"
              [class.bar-default]="!bar.highlight"></div>
            <span class="bar-label" [class.bar-label-active]="bar.highlight">{{ bar.label }}</span>
          </div>
        </div>
      </div>

      <!-- Top Performing Dealers -->
      <div class="leaderboard">
        <h3 class="leaderboard-title">Top Performing Dealers</h3>
        <div class="dealer-list">
          <div class="dealer-item" *ngFor="let dealer of topDealers">
            <div class="dealer-info">
              <span class="dealer-name">{{ dealer.name }}</span>
              <span class="dealer-value">{{ dealer.value }}</span>
            </div>
            <div class="dealer-bar-track">
              <div class="dealer-bar-fill" [style.width]="dealer.percent + '%'"></div>
            </div>
          </div>
        </div>
        <button class="btn-view-rankings">View Detailed Rankings</button>
      </div>
    </div>

    <!-- Recent Orders Table -->
    <div class="recent-orders-section" *ngIf="stats">
      <div class="orders-header">
        <div>
          <h3 class="orders-title">Recent Orders</h3>
          <span class="orders-sub">Latest order activity</span>
        </div>
        <div class="live-indicator" *ngIf="isConnected">
          <span class="live-dot"></span> Live
        </div>
      </div>
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
          <tr *ngFor="let order of stats?.recentOrders" [class.flash-row]="flashingOrderId === order.id">
            <td class="order-id">{{ order.id.substring(0, 8) }}...</td>
            <td class="font-semibold">{{ order.wholesalerName }}</td>
            <td class="price-cell">₹{{ order.totalAmount | number:'1.2-2' }}</td>
            <td><span class="status-tag" [attr.data-status]="order.status">{{ order.status }}</span></td>
            <td class="text-muted">{{ order.orderDate | date:'short' }}</td>
          </tr>
          <tr *ngIf="!stats?.recentOrders?.length">
            <td colspan="5" class="empty-state">No orders yet</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div *ngIf="toastMessage" class="toast success">{{ toastMessage }}</div>
  `,
  styles: [`
    /* ─── Header ──────────────────────────────────────────────── */
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 32px;
    }
    .dash-title {
      font-size: 2rem;
      font-weight: 900;
      color: var(--on-surface);
      letter-spacing: -0.04em;
      margin: 0 0 4px;
    }
    .dash-subtitle {
      color: var(--on-surface-variant);
      font-weight: 500;
      font-size: 0.9rem;
      margin: 0;
    }
    .dash-subtitle .highlight {
      color: var(--primary);
      font-weight: 700;
    }
    .btn-generate {
      background: var(--kinetic-gradient);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(187,0,22,0.2);
      transition: all 0.15s;
      font-family: 'Inter', sans-serif;
    }
    .btn-generate:hover { transform: scale(1.03); }
    .btn-generate:active { transform: scale(0.97); }

    /* ─── Access Notice ───────────────────────────────────────── */
    .access-notice {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: var(--surface-container-low);
      border-left: 4px solid var(--tertiary);
      border-radius: 8px;
      color: var(--on-surface-variant);
      font-size: 0.9rem;
      margin-bottom: 24px;
    }
    .access-notice .material-symbols-outlined {
      color: var(--tertiary);
      font-size: 22px;
    }

    /* ─── KPI Grid ────────────────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }
    .kpi-card {
      background: var(--surface-container-lowest);
      padding: 24px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 160px;
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;
    }
    .kpi-alert {
      border-left: 4px solid var(--primary);
    }
    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .kpi-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kpi-icon-wrap .material-symbols-outlined { font-size: 22px; }
    .kpi-primary { background: rgba(187,0,22,0.1); color: var(--primary); }
    .kpi-primary .material-symbols-outlined { color: var(--primary); }
    .kpi-tertiary { background: rgba(0,98,142,0.1); color: var(--tertiary); }
    .kpi-tertiary .material-symbols-outlined { color: var(--tertiary); }
    .kpi-secondary { background: rgba(138,26,26,0.1); color: var(--on-secondary-fixed-variant); }
    .kpi-secondary .material-symbols-outlined { color: var(--on-secondary-fixed-variant); }
    .kpi-error { background: rgba(255,218,214,0.3); color: var(--error); }
    .kpi-error .material-symbols-outlined { color: var(--error); }
    .kpi-trend {
      font-size: 0.65rem;
      font-weight: 700;
    }
    .kpi-trend.positive { color: #059669; }
    .kpi-trend.neutral { color: var(--on-surface-variant); }
    .kpi-trend.danger { color: var(--error); }
    .kpi-bottom { z-index: 1; }
    .kpi-value {
      font-size: 1.875rem;
      font-weight: 900;
      color: var(--on-surface);
      letter-spacing: -0.02em;
      margin: 0 0 2px;
    }
    .kpi-label {
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin: 0;
    }
    .kpi-watermark {
      position: absolute;
      right: -16px;
      bottom: -16px;
      opacity: 0.05;
    }
    .kpi-watermark .material-symbols-outlined {
      font-size: 120px;
    }

    /* ─── Charts Row ──────────────────────────────────────────── */
    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 28px;
      margin-bottom: 32px;
    }
    .chart-area {
      background: var(--surface-container-low);
      padding: 32px;
      border-radius: 12px;
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }
    .chart-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--on-surface);
      letter-spacing: -0.02em;
      margin: 0 0 4px;
    }
    .chart-sub {
      font-size: 0.8rem;
      color: var(--on-surface-variant);
      margin: 0;
    }
    .chart-tabs { display: flex; gap: 8px; }
    .chart-tab {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 700;
      cursor: pointer;
      background: transparent;
      color: var(--on-surface-variant);
      font-family: 'Inter', sans-serif;
      transition: all 0.2s;
    }
    .chart-tab.active {
      background: #ffffff;
      color: var(--on-surface);
      box-shadow: var(--shadow-sm);
    }

    /* Bar Chart */
    .bar-chart {
      height: 240px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
    }
    .bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .bar {
      width: 100%;
      border-radius: 6px 6px 0 0;
      transition: all 0.3s;
    }
    .bar-default {
      background: rgba(187,0,22,0.15);
    }
    .bar-default:hover {
      background: rgba(187,0,22,0.35);
    }
    .bar-highlight {
      background: var(--primary);
      box-shadow: 0 -8px 16px rgba(187,0,22,0.2);
    }
    .bar-label {
      margin-top: 12px;
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--on-surface-variant);
      text-transform: uppercase;
    }
    .bar-label-active {
      color: var(--primary);
      font-weight: 900;
    }

    /* ─── Leaderboard ────────────────────────────────────────── */
    .leaderboard {
      background: var(--surface-container-lowest);
      padding: 32px;
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }
    .leaderboard-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--on-surface);
      letter-spacing: -0.02em;
      margin: 0 0 24px;
    }
    .dealer-list { display: flex; flex-direction: column; gap: 20px; }
    .dealer-item { display: flex; flex-direction: column; gap: 8px; }
    .dealer-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }
    .dealer-name { font-weight: 700; color: var(--on-surface); }
    .dealer-value { font-weight: 900; color: var(--primary); }
    .dealer-bar-track {
      width: 100%;
      height: 8px;
      background: var(--surface-container);
      border-radius: 9999px;
      overflow: hidden;
    }
    .dealer-bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 9999px;
      transition: width 0.6s ease;
    }
    .btn-view-rankings {
      width: 100%;
      margin-top: 28px;
      padding: 12px;
      background: none;
      border: none;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--tertiary);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      cursor: pointer;
      transition: background 0.2s;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
    }
    .btn-view-rankings:hover { background: rgba(0,98,142,0.05); }

    /* ─── Recent Orders ──────────────────────────────────────── */
    .recent-orders-section {
      background: var(--surface-container-lowest);
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .orders-header {
      padding: 24px 24px 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .orders-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--on-surface);
      margin: 0 0 4px;
    }
    .orders-sub {
      font-size: 0.8rem;
      color: var(--on-surface-variant);
    }
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      background: rgba(16,185,129,0.06);
      border: 1px solid rgba(16,185,129,0.15);
      border-radius: 20px;
      font-size: 0.7rem;
      color: #059669;
      font-weight: 700;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      animation: livePulse 2s infinite;
    }
    @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .order-id {
      font-family: monospace;
      color: var(--on-surface-variant);
      font-size: 0.85rem;
    }
    .font-semibold { font-weight: 600; }
    .price-cell { font-weight: 700; color: var(--primary); }
    .text-muted { color: var(--on-surface-variant); }
    .empty-state {
      text-align: center;
      color: var(--outline);
      padding: 40px !important;
    }
    .flash-row { animation: rowFlash 1s ease; }
    @keyframes rowFlash { 0%, 100% { background: transparent; } 50% { background: rgba(187,0,22,0.04); } }

    /* ─── Responsive ─────────────────────────────────────────── */
    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .dash-header { flex-direction: column; gap: 16px; align-items: flex-start; }
    }
  `]
})
export class AdminHomeComponent implements OnInit, OnDestroy {
  stats: DashboardStats | null = null;
  isConnected = false;
  flashingOrderId: string | null = null;
  toastMessage = '';
  accessNotice = '';
  userRole = '';
  private subs: Subscription[] = [];

  // Static chart data
  chartBars = [
    { label: 'Mon', height: '40%', highlight: false },
    { label: 'Tue', height: '65%', highlight: false },
    { label: 'Wed', height: '55%', highlight: false },
    { label: 'Thu', height: '90%', highlight: true },
    { label: 'Fri', height: '70%', highlight: false },
    { label: 'Sat', height: '35%', highlight: false },
    { label: 'Sun', height: '45%', highlight: false },
  ];

  topDealers = [
    { name: 'Atlanta Hub Alpha', value: '8.4k units', percent: 92 },
    { name: 'Chicago Logistics Co.', value: '7.2k units', percent: 78 },
    { name: 'Dallas Forwarding', value: '6.5k units', percent: 65 },
    { name: 'Phoenix Supply', value: '5.1k units', percent: 52 },
  ];

  get dashTitle(): string {
    switch (this.userRole) {
      case 'Admin': return 'Super Admin Dashboard';
      case 'Wholesaler': return 'Wholesaler Dashboard';
      case 'WarehouseManager': return 'Warehouse Dashboard';
      default: return 'Dashboard';
    }
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private signalR: SignalRService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userRole = this.authService.userRole;
    this.loadStats();

    // Subscribe to SignalR events for real-time dashboard updates
    this.subs.push(
      this.signalR.connectionState.subscribe(state => {
        this.isConnected = state === 'connected';
      }),
      this.signalR.newOrderReceived.subscribe(alert => {
        this.toastMessage = `New order from ${alert.wholesalerName} — ₹${alert.totalAmount}`;
        setTimeout(() => this.toastMessage = '', 4000);
        this.loadStats();
      }),
      this.signalR.orderStatusChanged.subscribe(update => {
        this.flashingOrderId = update.orderId;
        setTimeout(() => this.flashingOrderId = null, 1500);
        this.loadStats();
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadStats() {
    this.apiService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.accessNotice = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 403) {
          // User doesn't have permission — show friendly notice instead of console error
          this.accessNotice = 'Dashboard statistics are not available for your role. Navigate to your section from the sidebar.';
          console.info('[Dashboard] Stats not available for role:', this.userRole);
        } else {
          console.error('Failed to load stats', err);
        }
        this.cdr.detectChanges();
      }
    });
  }
}

