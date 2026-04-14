import { Component, OnInit, inject, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { OrderService } from '../../../../core/services/order.service';
import { CartService } from '../../../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  template: `
    <div class="dashboard-container fade-in">
      <!-- Welcome Section -->
      <div class="welcome-card glass-card">
        <div class="welcome-text">
          <h1>{{ greeting }}, {{ userName() }} 👋</h1>
          <p>You have {{ activeOrders() }} active shipments in transit.</p>
        </div>
        <div class="stats-mini">
           <div class="stat-item">
             <span class="label">Total Points</span>
             <span class="value">2,450</span>
           </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card glass-card">
          <div class="icon-box blue">
            <i-lucide name="shopping-bag" [size]="24"></i-lucide>
          </div>
          <div class="kpi-info">
            <span class="label">Total Orders</span>
            <span class="value">{{ totalOrders() }}</span>
          </div>
        </div>
        <div class="kpi-card glass-card">
          <div class="icon-box amber">
            <i-lucide name="package" [size]="24"></i-lucide>
          </div>
          <div class="kpi-info">
            <span class="label">Active Orders</span>
            <span class="value">{{ activeOrders() }}</span>
          </div>
        </div>
        <div class="kpi-card glass-card">
          <div class="icon-box green">
            <i-lucide name="credit-card" [size]="24"></i-lucide>
          </div>
          <div class="kpi-info">
            <span class="label">Total Spend</span>
            <span class="value">₹{{ totalSpent() | number:'1.0-0' }}</span>
          </div>
        </div>
        <div class="kpi-card glass-card">
          <div class="icon-box purple">
            <i-lucide name="bell" [size]="24"></i-lucide>
          </div>
          <div class="kpi-info">
            <span class="label">Notifications</span>
            <span class="value">12</span>
          </div>
        </div>
      </div>

      <div class="layout-grid">
        <!-- Recent Orders -->
        <div class="main-column">
          <div class="section-header">
            <h2>Recent Orders</h2>
            <button class="text-btn" routerLink="/dealer/orders">View All</button>
          </div>
          <div class="table-card glass-card">
            <table class="compact-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (order of recentOrders(); track order.orderId) {
                  <tr>
                    <td class="bold">#{{ order.orderNumber }}</td>
                    <td>{{ order.placedAt | date:'shortDate' }}</td>
                    <td>₹{{ order.totalAmount | number:'1.2-2' }}</td>
                    <td>
                      <span class="status-dot" [attr.data-status]="order.status.toLowerCase()">
                        {{ order.status }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty">No recent orders.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Featured / Reorder -->
        <div class="side-column">
          <div class="section-header">
             <h2>Quick Reorder</h2>
          </div>
          <div class="products-mini">
            @for (product of featuredProducts(); track product.id) {
              <div class="product-item glass-card">
                <div class="prod-img">{{ product.name[0] }}</div>
                <div class="prod-info">
                  <span class="name">{{ product.name }}</span>
                  <span class="price">₹{{ product.price }}</span>
                </div>
                <button class="add-btn" (click)="addToCart(product)">
                  <i-lucide name="plus" [size]="16"></i-lucide>
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px; }

    .welcome-card {
      padding: 32px;
      background: linear-gradient(135deg, rgba(148, 0, 6, 0.92), rgba(204, 0, 7, 0.92));
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: none;
      h1 { font-size: 28px; margin-bottom: 8px; }
      p { opacity: 0.8; font-size: 16px; }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .kpi-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      .icon-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        &.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        &.amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        &.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        &.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
      }
      .label { font-size: 13px; color: var(--text-tertiary); display: block; }
      .value { font-size: 24px; font-weight: 800; color: var(--text-primary); }
    }

    .layout-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      h2 { font-size: 18px; font-weight: 700; color: var(--text-primary); }
      .text-btn { background: none; border: none; color: var(--hul-primary); font-weight: 600; cursor: pointer; }
    }

    .compact-table {
      width: 100%;
      border-collapse: collapse;
      th { text-align: left; padding: 12px 16px; font-size: 12px; color: var(--text-tertiary); text-transform: uppercase; }
      td { padding: 16px; border-top: 1px solid var(--border-default); font-size: 14px; }
      .bold { font-weight: 700; color: var(--text-primary); }
    }

    .products-mini {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .product-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      .prod-img { width: 40px; height: 40px; border-radius: 8px; background: var(--bg-muted); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--hul-primary); }
      .prod-info { flex: 1; .name { font-size: 14px; font-weight: 600; display: block; } .price { font-size: 12px; color: var(--text-tertiary); } }
      .add-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: var(--bg-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; &:hover { background: var(--hul-primary); color: white; } }
    }

    .status-dot {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      &::before { content: ''; width: 8px; height: 8px; border-radius: 50%; }
      &[data-status="delivered"]::before { background: #10b981; }
      &[data-status="processing"]::before { background: #3b82f6; }
      &[data-status="intransit"]::before { background: #8b5cf6; }
      &[data-status="placed"]::before { background: #f59e0b; }
    }

    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .layout-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private catalog = inject(CatalogService);
  private order = inject(OrderService);
  private cart = inject(CartService);

  userName = computed(() => this.auth.currentUser()?.fullName || 'Partner');
  totalOrders = computed(() => this.order.orders().length);
  activeOrders = computed(() => this.order.orders().filter(o => ['Placed', 'Processing', 'InTransit'].includes(o.status)).length);
  totalSpent = computed(() => this.order.orders().reduce((acc, o) => acc + o.totalAmount, 0));
  
  recentOrders = computed(() => this.order.orders().slice(0, 5));
  featuredProducts = computed(() => this.catalog.products().slice(0, 4));

  greeting = this.getGreeting();

  ngOnInit() {
    this.order.loadMyOrders();
    this.catalog.loadProducts({});
  }

  getGreeting(): string {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  addToCart(product: any) {
    // this.cart.addItem(product);
  }
}

