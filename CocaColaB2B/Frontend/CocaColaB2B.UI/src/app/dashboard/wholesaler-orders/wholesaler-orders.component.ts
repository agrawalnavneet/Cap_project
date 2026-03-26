import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Order } from '../../models/models';

@Component({
  selector: 'app-wholesaler-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header-actions">
      <h2>📋 My Orders</h2>
      <span class="order-count">{{ orders.length }} Orders</span>
    </div>

    <div *ngIf="orders.length === 0" class="empty-state glass-panel">
      <div class="empty-icon">📋</div>
      <h3>No orders yet</h3>
      <p>Your order history will appear here</p>
    </div>

    <div class="orders-list">
      <div *ngFor="let order of orders" class="order-card glass-panel" (click)="toggleExpand(order.id)">
        <div class="order-header">
          <div class="order-meta">
            <span class="order-id">#{{ order.id.substring(0, 8) }}</span>
            <span class="order-date">{{ order.orderDate | date:'mediumDate' }}</span>
          </div>
          <div class="order-right">
            <span class="order-total">\${{ order.totalAmount | number:'1.2-2' }}</span>
            <span class="status-badge" [attr.data-status]="order.status">{{ order.status }}</span>
          </div>
        </div>

        <!-- Status Timeline -->
        <div class="timeline" *ngIf="expandedId === order.id">
          <div class="timeline-step" [class.active]="isStatusReached(order.status, 'Pending')">
            <div class="step-dot"></div>
            <span>Pending</span>
          </div>
          <div class="timeline-line" [class.active]="isStatusReached(order.status, 'Approved')"></div>
          <div class="timeline-step" [class.active]="isStatusReached(order.status, 'Approved')">
            <div class="step-dot"></div>
            <span>Approved</span>
          </div>
          <div class="timeline-line" [class.active]="isStatusReached(order.status, 'OutForDelivery')"></div>
          <div class="timeline-step" [class.active]="isStatusReached(order.status, 'OutForDelivery')">
            <div class="step-dot"></div>
            <span>Out for Delivery</span>
          </div>
          <div class="timeline-line" [class.active]="isStatusReached(order.status, 'Delivered')"></div>
          <div class="timeline-step" [class.active]="isStatusReached(order.status, 'Delivered')">
            <div class="step-dot"></div>
            <span>Delivered</span>
          </div>
        </div>

        <!-- Order Items -->
        <div class="order-items" *ngIf="expandedId === order.id">
          <div class="item-row" *ngFor="let item of order.items">
            <div class="item-info">
              <img [src]="item.productImageUrl || 'https://placehold.co/40x40/1a1a1e/ffffff?text=P'" class="item-thumb" />
              <div>
                <span class="item-name">{{ item.productName }}</span>
                <span class="item-qty">x{{ item.quantity }}</span>
              </div>
            </div>
            <span class="item-price">\${{ item.totalPrice | number:'1.2-2' }}</span>
          </div>
          <div class="order-footer">
            <span>Shipping: {{ order.shippingAddress || 'N/A' }}</span>
            <span *ngIf="order.driverName">Driver: {{ order.driverName }}</span>
          </div>
        </div>

        <div class="expand-hint">
          {{ expandedId === order.id ? '▲ Collapse' : '▼ View Details' }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    .order-count { background: rgba(255,255,255,0.08); padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; color: rgba(255,255,255,0.6); }

    .empty-state { text-align: center; padding: 80px 40px; border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); }
    .empty-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { margin-bottom: 8px; }
    .empty-state p { color: rgba(255,255,255,0.4); }

    .orders-list { display: flex; flex-direction: column; gap: 16px; }
    .order-card { padding: 0; border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); cursor: pointer; overflow: hidden; transition: 0.3s; }
    .order-card:hover { border-color: rgba(255,255,255,0.1); transform: translateY(-2px); }

    .order-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; }
    .order-meta { display: flex; flex-direction: column; gap: 4px; }
    .order-id { font-family: monospace; font-weight: 600; color: var(--primary); }
    .order-date { font-size: 0.8rem; color: rgba(255,255,255,0.4); }
    .order-right { display: flex; align-items: center; gap: 16px; }
    .order-total { font-weight: 700; font-size: 1.2rem; color: #10b981; }

    .status-badge { padding: 5px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge[data-status="Pending"] { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-badge[data-status="Approved"] { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-badge[data-status="Rejected"] { background: rgba(239,68,68,0.15); color: #ef4444; }
    .status-badge[data-status="OutForDelivery"] { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .status-badge[data-status="Delivered"] { background: rgba(139,92,246,0.15); color: #8b5cf6; }

    /* Timeline */
    .timeline { display: flex; align-items: center; padding: 20px 24px; gap: 0; }
    .timeline-step { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 80px; }
    .step-dot { width: 14px; height: 14px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.1); transition: 0.3s; }
    .timeline-step.active .step-dot { background: #10b981; border-color: #10b981; box-shadow: 0 0 12px rgba(16,185,129,0.4); }
    .timeline-step span { font-size: 0.7rem; color: rgba(255,255,255,0.3); text-align: center; }
    .timeline-step.active span { color: #10b981; font-weight: 600; }
    .timeline-line { flex: 1; height: 2px; background: rgba(255,255,255,0.08); }
    .timeline-line.active { background: #10b981; }

    /* Order Items */
    .order-items { padding: 0 24px 16px; border-top: 1px solid rgba(255,255,255,0.05); }
    .item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .item-info { display: flex; align-items: center; gap: 12px; }
    .item-thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: contain; background: rgba(255,255,255,0.03); }
    .item-name { font-size: 0.9rem; }
    .item-qty { font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-left: 8px; }
    .item-price { font-weight: 600; color: #10b981; }

    .order-footer { padding: 12px 0 4px; font-size: 0.8rem; color: rgba(255,255,255,0.4); display: flex; justify-content: space-between; }

    .expand-hint { text-align: center; padding: 10px; font-size: 0.75rem; color: rgba(255,255,255,0.25); border-top: 1px solid rgba(255,255,255,0.03); }
  `]
})
export class WholesalerOrdersComponent implements OnInit {
  orders: Order[] = [];
  expandedId: string | null = null;

  private statusOrder = ['Pending', 'Approved', 'OutForDelivery', 'Delivered'];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getOrders().subscribe({
      next: (d) => this.orders = d.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()),
      error: () => this.orders = []
    });
  }

  toggleExpand(id: string) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  isStatusReached(currentStatus: string, checkStatus: string): boolean {
    return this.statusOrder.indexOf(currentStatus) >= this.statusOrder.indexOf(checkStatus);
  }
}
