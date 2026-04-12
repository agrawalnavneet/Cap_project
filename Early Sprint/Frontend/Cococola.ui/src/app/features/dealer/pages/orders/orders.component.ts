import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { OrderService, Order } from '../../../../core/services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-orders',
  standalone: false,
  template: `
    <div class="orders-container fade-in">
      <div class="orders-header">
        <div>
          <h1 class="orders-title">Order History</h1>
          <p class="orders-subtitle">Manage and track your wholesale shipments</p>
        </div>
        <div class="header-actions">
           <button class="refresh-btn" (click)="loadOrders()" [disabled]="loading()">
             <i-lucide name="rotate-ccw" [size]="18" [class.spin]="loading()"></i-lucide>
           </button>
        </div>
      </div>

      <!-- Filters & Stats -->
      <div class="filters-bar glass-card">
        <div class="status-filters">
          @for (f of filters; track f.value) {
            <button class="filter-chip" 
                    [class.active]="activeFilter() === f.value"
                    (click)="activeFilter.set(f.value)">
              {{ f.label }}
            </button>
          }
        </div>
        <div class="search-wrap">
          <i-lucide name="search" [size]="16"></i-lucide>
          <input type="text" placeholder="Search order ID..." [(ngModel)]="searchQuery" />
        </div>
      </div>

      <!-- Orders Table -->
      <div class="table-container glass-card">
        <table class="premium-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Placed Date</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
               @for (i of [1,2,3,4,5]; track i) {
                 <tr class="skeleton-row">
                   <td colspan="6"><div class="skeleton"></div></td>
                 </tr>
               }
            } @else {
              @for (order of filteredOrders(); track order.orderId) {
                <tr class="order-row">
                  <td>
                    <span class="order-id">#{{ order.orderNumber }}</span>
                  </td>
                  <td>
                    <div class="date-cell">
                      <span class="main">{{ order.placedAt | date:'mediumDate' }}</span>
                      <span class="sub">{{ order.placedAt | date:'shortTime' }}</span>
                    </div>
                  </td>
                  <td>{{ order.totalItems || 0 }} Items</td>
                  <td>
                    <span class="amount">₹{{ order.totalAmount | number:'1.2-2' }}</span>
                  </td>
                  <td>
                    <span class="status-badge" [attr.data-status]="order.status.toLowerCase()">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="text-right">
                    <button class="view-btn" [routerLink]="['/dealer/orders', order.orderId]">
                      View Details
                      <i-lucide name="arrow-right" [size]="14"></i-lucide>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty-cell">
                    <div class="empty-state">
                      <i-lucide name="shopping-bag" [size]="48"></i-lucide>
                      <h3>No orders found</h3>
                      <p>Try adjusting your filters or search query.</p>
                      <button class="primary-btn" (click)="goToCatalog()">Browse Catalog</button>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .orders-container {
      padding-bottom: 40px;
    }

    .orders-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 32px;

      .orders-title { font-size: 32px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px; }
      .orders-subtitle { font-size: 16px; color: var(--text-tertiary); margin: 0; }
    }

    .refresh-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 1px solid var(--border-default);
      background: var(--bg-card);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      &:hover { border-color: var(--hul-primary); color: var(--hul-primary); }
      .spin { animation: spin 1s linear infinite; }
    }

    .filters-bar {
      padding: 16px 24px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .status-filters {
      display: flex;
      gap: 8px;
    }

    .filter-chip {
      padding: 8px 16px;
      border-radius: 10px;
      background: var(--bg-muted);
      border: 1px solid transparent;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { background: var(--border-default); }
      &.active {
        background: var(--hul-primary);
        color: white;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
      }
    }

    .search-wrap {
      position: relative;
      flex: 1;
      max-width: 320px;
      i-lucide {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-tertiary);
      }
      input {
        width: 100%;
        padding: 10px 14px 10px 40px;
        border: 1px solid var(--border-default);
        border-radius: 12px;
        background: var(--bg-muted);
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
        &:focus { border-color: var(--hul-primary); background: white; }
      }
    }

    .table-container {
      padding: 0;
      overflow: hidden;
    }

    .premium-table {
      width: 100%;
      border-collapse: collapse;
      
      th {
        padding: 16px 24px;
        text-align: left;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-tertiary);
        border-bottom: 1px solid var(--border-default);
        background: var(--bg-muted);
      }

      td { padding: 20px 24px; border-bottom: 1px solid var(--border-default); }
    }

    .order-row {
      transition: background 0.2s;
      &:hover { background: var(--bg-subtle); }
      &:last-child td { border-bottom: none; }
    }

    .order-id { font-weight: 700; color: var(--text-primary); }
    
    .date-cell {
      display: flex;
      flex-direction: column;
      .main { font-weight: 600; color: var(--text-primary); }
      .sub { font-size: 12px; color: var(--text-tertiary); }
    }

    .amount { font-family: var(--font-mono); font-weight: 700; color: var(--text-primary); }

    .status-badge {
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-block;

      &[data-status="delivered"] { background: #d1fae5; color: #065f46; }
      &[data-status="processing"] { background: #dbeafe; color: #1e40af; }
      &[data-status="placed"] { background: #fef3c7; color: #92400e; }
      &[data-status="cancelled"] { background: #fee2e2; color: #991b1b; }
      &[data-status="intransit"] { background: #f3e8ff; color: #6b21a8; }
    }

    .view-btn {
      padding: 8px 16px;
      border-radius: 8px;
      background: var(--bg-muted);
      border: none;
      color: var(--hul-primary);
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      &:hover { background: var(--hul-primary); color: white; }
    }

    .empty-state {
      padding: 60px 0;
      text-align: center;
      i-lucide { color: var(--text-disabled); margin-bottom: 16px; }
      h3 { font-size: 20px; color: var(--text-primary); margin-bottom: 8px; }
      p { color: var(--text-tertiary); margin-bottom: 24px; }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .text-right { text-align: right !important; }

    @media (max-width: 768px) {
      .premium-table {
        th:nth-child(3), td:nth-child(3),
        th:nth-child(2), td:nth-child(2) { display: none; }
      }
      .header-actions { display: none; }
    }
  `]
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);

  loading = this.orderService.loading;
  activeFilter = signal<string | null>(null);
  searchQuery = '';

  filters = [
    { label: 'All Orders', value: null },
    { label: 'Processing', value: 'Processing' },
    { label: 'In Transit', value: 'InTransit' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  filteredOrders = computed(() => {
    let list = this.orderService.orders();
    const filter = this.activeFilter();
    const query = this.searchQuery.toLowerCase();

    if (filter) {
      list = list.filter(o => o.status === filter);
    }
    if (query) {
      list = list.filter(o => o.orderNumber.toLowerCase().includes(query) || o.orderId.toLowerCase().includes(query));
    }
    return list;
  });

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.loadMyOrders();
  }

  goToCatalog() {
    this.router.navigate(['/dealer/catalog']);
  }
}

