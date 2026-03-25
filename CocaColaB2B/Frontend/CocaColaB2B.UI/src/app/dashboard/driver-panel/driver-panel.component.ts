import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Delivery } from '../../models/models';

@Component({
  selector: 'app-driver-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>🚚 Delivery Dashboard</h2>
    </div>

    <div class="stats-row">
      <div class="stat-card glass-panel">
        <div class="stat-icon assigned-icon">📝</div>
        <div class="stat-content">
          <p>Assigned Deliveries</p>
          <h3>{{ assignedDeliveries.length }}</h3>
        </div>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-icon success-icon">✓</div>
        <div class="stat-content">
          <p>Completed Today</p>
          <h3>{{ completedCount }}</h3>
        </div>
      </div>
    </div>

    <div class="admin-panel glass-panel">
      <div class="panel-header">
        <h3>My Deliveries</h3>
      </div>
      
      <div class="deliveries-grid">
        <div *ngFor="let d of deliveries" class="delivery-card" [ngClass]="d.status.toLowerCase()">
          <div class="d-header">
            <span class="order-id">#{{ d.orderId.substr(0,8) }}</span>
            <span class="status-badge" [ngClass]="d.status.toLowerCase()">{{ d.status }}</span>
          </div>
          <div class="d-body">
            <h3>{{ d.wholesalerName }}</h3>
            <p class="address">📍 {{ d.shippingAddress || 'No address provided' }}</p>
            <p class="amount">💰 \${{ d.orderTotal | number:'1.2-2' }}</p>
            <p class="time">🕒 Assigned: {{ d.assignedAt | date:'shortTime' }}</p>
            
            <div *ngIf="d.status !== 'Delivered'" class="notes-section">
              <input type="text" [(ngModel)]="deliveryNotes[d.id]" placeholder="Add delivery notes..." class="form-input d-notes" />
            </div>
            
            <p *ngIf="d.status === 'Delivered' && d.notes" class="saved-notes">📝 {{ d.notes }}</p>
          </div>
          <div class="d-footer" *ngIf="d.status !== 'Delivered'">
            <button *ngIf="d.status === 'Assigned'" class="btn-primary full-width" (click)="updateStatus(d, 'OutForDelivery')">
              Start Delivery
            </button>
            <button *ngIf="d.status === 'OutForDelivery'" class="btn-success full-width" (click)="updateStatus(d, 'Delivered')">
              Mark Delivered
            </button>
          </div>
        </div>
        
        <div *ngIf="deliveries.length === 0" class="empty-state">
          No deliveries assigned to you right now. Grab a Coke and relax! 🥤
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { margin-bottom: 24px; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 30px; }
    .stat-card { padding: 24px; border-radius: 20px; display: flex; align-items: center; gap: 20px; transition: transform 0.3s; }
    .stat-icon { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
    .assigned-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .success-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .stat-content p { color: rgba(255,255,255,0.6); font-size: 0.9rem; margin: 0 0 5px 0; font-weight: 500; }
    .stat-content h3 { font-size: 2rem; margin: 0; font-weight: 700; color: white; }
    
    .panel-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .panel-header h3 { margin: 0; font-size: 1.2rem; font-weight: 600; }
    
    .deliveries-grid { padding: 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .delivery-card { background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: 0.3s; }
    .delivery-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .delivery-card.delivered { opacity: 0.7; }
    
    .d-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.1); }
    .order-id { font-family: monospace; color: rgba(255,255,255,0.6); }
    
    .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.assigned { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .status-badge.outfordelivery { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .status-badge.delivered { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    
    .d-body { padding: 20px; flex-grow: 1; }
    .d-body h3 { margin: 0 0 12px 0; font-size: 1.1rem; }
    .d-body p { margin: 0 0 8px 0; font-size: 0.9rem; color: rgba(255,255,255,0.7); display: flex; align-items: flex-start; gap: 8px; }
    
    .notes-section { margin-top: 16px; }
    .d-notes { width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.2); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; font-size: 0.85rem; color: white; transition: 0.2s; }
    .d-notes:focus { border-color: var(--primary); outline: none; background: rgba(255,255,255,0.05); }
    .saved-notes { margin-top: 12px !important; color: #fbbf24 !important; font-style: italic; background: rgba(245, 158, 11, 0.1); padding: 8px 12px; border-radius: 8px; }
    
    .d-footer { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); }
    .full-width { width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: #d0111f; }
    .btn-success { background: #10b981; color: white; }
    .btn-success:hover { background: #059669; }
    
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5); font-style: italic; font-size: 1.1rem; }
  `]
})
export class DriverPanelComponent implements OnInit {
  deliveries: Delivery[] = [];
  deliveryNotes: { [key: string]: string } = {};

  get assignedDeliveries() { return this.deliveries.filter(d => d.status !== 'Delivered'); }
  get completedCount() { 
    const today = new Date().toDateString();
    return this.deliveries.filter(d => d.status === 'Delivered' && new Date(d.deliveredAt!).toDateString() === today).length; 
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadDeliveries();
  }

  loadDeliveries() {
    this.api.getDeliveries().subscribe(res => {
      this.deliveries = res;
      this.deliveries.forEach(d => {
        if (!this.deliveryNotes[d.id]) this.deliveryNotes[d.id] = d.notes || '';
      });
    });
  }

  updateStatus(d: Delivery, newStatus: string) {
    const notes = this.deliveryNotes[d.id];
    this.api.updateDeliveryStatus(d.id, { status: newStatus, notes }).subscribe(() => {
      this.loadDeliveries();
    });
  }
}
