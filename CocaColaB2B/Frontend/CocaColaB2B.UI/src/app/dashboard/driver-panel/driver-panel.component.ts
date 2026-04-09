import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SignalRService } from '../../services/signalr.service';
import { Delivery } from '../../models/models';

@Component({
  selector: 'app-driver-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>My Deliveries</h2>
      <div class="header-right">
        <div class="live-indicator" *ngIf="isConnected"><span class="live-dot"></span> Live</div>
        <div class="tab-toggle">
          <button [class.active]="activeView === 'active'" (click)="activeView = 'active'">
            Active <span class="count-badge" *ngIf="activeDeliveries.length > 0">{{ activeDeliveries.length }}</span>
          </button>
          <button [class.active]="activeView === 'history'" (click)="activeView = 'history'">History</button>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-icon-wrap tertiary-bg"><span class="material-symbols-outlined">assignment</span></div><div class="stat-content"><p>Assigned</p><h3>{{ assignedCount }}</h3></div></div>
      <div class="stat-card"><div class="stat-icon-wrap warning-bg"><span class="material-symbols-outlined">local_shipping</span></div><div class="stat-content"><p>Out for Delivery</p><h3>{{ inTransitCount }}</h3></div></div>
      <div class="stat-card"><div class="stat-icon-wrap success-bg"><span class="material-symbols-outlined">check_circle</span></div><div class="stat-content"><p>Completed Today</p><h3>{{ completedTodayCount }}</h3></div></div>
      <div class="stat-card"><div class="stat-icon-wrap primary-bg"><span class="material-symbols-outlined">package_2</span></div><div class="stat-content"><p>All Time</p><h3>{{ deliveredCount }}</h3></div></div>
    </div>

    <!-- Active Deliveries -->
    <div *ngIf="activeView === 'active'" class="deliveries-section">
      <div class="deliveries-grid">
        <div *ngFor="let d of activeDeliveries; trackBy: trackById" class="delivery-card" [class.in-transit]="d.status === 'OutForDelivery'">
          <div class="d-header">
            <span class="order-id">#{{ d.orderId.substring(0,8) }}</span>
            <span class="status-pill" [attr.data-status]="d.status">
              <span class="status-dot-s"></span>
              {{ d.status === 'OutForDelivery' ? 'In Transit' : d.status }}
            </span>
          </div>
          <div class="progress-stepper">
            <div class="step" [class.active]="true" [class.completed]="d.status !== 'Assigned'"><div class="step-circle">1</div><span>Assigned</span></div>
            <div class="step-line" [class.active]="d.status === 'OutForDelivery' || d.status === 'Delivered'"></div>
            <div class="step" [class.active]="d.status === 'OutForDelivery' || d.status === 'Delivered'" [class.completed]="d.status === 'Delivered'"><div class="step-circle">2</div><span>In Transit</span></div>
            <div class="step-line" [class.active]="d.status === 'Delivered'"></div>
            <div class="step" [class.active]="d.status === 'Delivered'"><div class="step-circle">3</div><span>Delivered</span></div>
          </div>
          <div class="d-body">
            <h3>{{ d.wholesalerName }}</h3>
            <div class="address-card">
              <span class="material-symbols-outlined" style="font-size:20px;color:var(--primary)">location_on</span>
              <div class="address-text">
                <span class="address-label">Delivery Address</span>
                <span class="address-value">{{ d.shippingAddress || 'No address provided' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item"><span class="info-label">Amount</span><span class="info-value amount">₹{{ d.orderTotal | number:'1.2-2' }}</span></div>
              <div class="info-item"><span class="info-label">Assigned</span><span class="info-value">{{ d.assignedAt | date:'shortTime' }}</span></div>
            </div>
            <div class="notes-section">
              <input type="text" [(ngModel)]="deliveryNotes[d.id]" placeholder="Add delivery notes..." class="form-input d-notes" />
            </div>
          </div>
          <div class="d-footer">
            <button *ngIf="d.status === 'Assigned'" class="btn-action btn-start" (click)="confirmStatusChange(d, 'OutForDelivery')">
              <span class="material-symbols-outlined" style="font-size:18px">rocket_launch</span> Start Delivery
            </button>
            <button *ngIf="d.status === 'OutForDelivery'" class="btn-action btn-complete" (click)="confirmStatusChange(d, 'Delivered')">
              <span class="material-symbols-outlined" style="font-size:18px">check_circle</span> Mark Delivered
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="activeDeliveries.length === 0" class="empty-state">
        <span class="material-symbols-outlined empty-icon">local_shipping</span>
        <h3>No active deliveries</h3>
        <p>New deliveries will appear here automatically.</p>
      </div>
    </div>

    <!-- History -->
    <div *ngIf="activeView === 'history'" class="history-section">
      <div class="history-panel">
        <div *ngFor="let d of completedDeliveries" class="history-item">
          <div class="history-left">
            <span class="history-id">#{{ d.orderId.substring(0,8) }}</span>
            <div class="history-info"><span class="history-name">{{ d.wholesalerName }}</span><span class="history-addr"><span class="material-symbols-outlined" style="font-size:12px">location_on</span> {{ d.shippingAddress || 'N/A' }}</span></div>
          </div>
          <div class="history-right">
            <span class="history-amount">₹{{ d.orderTotal | number:'1.2-2' }}</span>
            <span class="history-date">{{ d.deliveredAt | date:'medium' }}</span>
            <span *ngIf="d.notes" class="history-notes"><span class="material-symbols-outlined" style="font-size:12px">sticky_note_2</span> {{ d.notes }}</span>
          </div>
        </div>
        <div *ngIf="completedDeliveries.length === 0" class="empty-state-inline">No completed deliveries yet</div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div class="modal-overlay" *ngIf="showConfirmDialog" (click)="showConfirmDialog = false">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <span class="material-symbols-outlined confirm-icon">{{ confirmAction === 'OutForDelivery' ? 'local_shipping' : 'check_circle' }}</span>
        <h3>{{ confirmAction === 'OutForDelivery' ? 'Start this delivery?' : 'Confirm delivery completion?' }}</h3>
        <p>{{ confirmAction === 'OutForDelivery' ? 'This will mark the order as "Out for Delivery" and notify the wholesaler.' : 'Make sure the goods have been handed over.' }}</p>
        <div class="confirm-buttons">
          <button class="btn-secondary" (click)="showConfirmDialog = false">Cancel</button>
          <button class="btn-primary" (click)="executeStatusChange()">{{ confirmAction === 'OutForDelivery' ? 'Start Delivery' : 'Confirm Delivered' }}</button>
        </div>
      </div>
    </div>

    <div *ngIf="toastMessage" class="toast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">{{ toastMessage }}</div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .header-right { display: flex; align-items: center; gap: 16px; }
    .live-indicator { display: flex; align-items: center; gap: 8px; padding: 5px 14px; background: rgba(0,110,47,0.06); border: 1px solid rgba(0,110,47,0.15); border-radius: 20px; font-size: 0.7rem; color: var(--secondary); font-weight: 700; }
    .live-dot { width: 7px; height: 7px; background: var(--secondary); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .tab-toggle { display: flex; background: var(--surface-container-low); border-radius: 10px; padding: 3px; }
    .tab-toggle button { padding: 8px 18px; border: none; background: transparent; color: var(--on-surface-variant); border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.8rem; transition: 0.2s; display: flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif; }
    .tab-toggle button.active { background: linear-gradient(135deg, var(--primary), var(--primary-container)); color: white; }
    .count-badge { background: rgba(255,255,255,0.3); padding: 1px 8px; border-radius: 10px; font-size: 0.65rem; font-weight: 700; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: var(--surface-container-lowest); padding: 20px; border-radius: 16px; box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 16px; transition: transform 0.3s; }
    .stat-card:hover { transform: translateY(-3px); }
    .stat-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon-wrap .material-symbols-outlined { font-size: 22px; }
    .primary-bg { background: rgba(79,70,229,0.08); color: var(--primary); }
    .tertiary-bg { background: rgba(0,69,152,0.08); color: var(--tertiary); }
    .warning-bg { background: rgba(245,158,11,0.08); color: #b45309; }
    .success-bg { background: rgba(0,110,47,0.08); color: var(--secondary); }
    .stat-content p { color: var(--on-surface-variant); font-size: 0.75rem; margin: 0 0 4px 0; font-weight: 600; }
    .stat-content h3 { font-size: 1.5rem; margin: 0; font-weight: 700; color: var(--on-surface); font-family: 'Manrope', sans-serif; }

    .deliveries-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
    .delivery-card { background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; display: flex; flex-direction: column; transition: all 0.3s; }
    .delivery-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-xl); }
    .delivery-card.in-transit { outline: 1px solid rgba(245,158,11,0.25); }
    .d-header { padding: 16px 20px; border-bottom: 1px solid var(--surface-container-low); display: flex; justify-content: space-between; align-items: center; background: var(--surface-container-low); }
    .order-id { font-family: monospace; color: var(--outline); font-size: 0.85rem; }
    .status-pill { padding: 5px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; }
    .status-pill[data-status="Assigned"] { background: rgba(0,69,152,0.08); color: var(--tertiary); }
    .status-pill[data-status="OutForDelivery"] { background: rgba(245,158,11,0.08); color: #b45309; }
    .status-pill[data-status="Delivered"] { background: rgba(0,110,47,0.08); color: var(--secondary); }
    .status-dot-s { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

    .progress-stepper { display: flex; align-items: center; padding: 18px 20px; gap: 0; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 70px; }
    .step-circle { width: 28px; height: 28px; border-radius: 50%; background: var(--surface-container-high); border: 2px solid var(--outline-variant); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: var(--outline); transition: 0.3s; }
    .step.active .step-circle { background: rgba(0,69,152,0.1); border-color: var(--tertiary); color: var(--tertiary); }
    .step.completed .step-circle { background: var(--secondary); border-color: var(--secondary); color: white; }
    .step span { font-size: 0.6rem; color: var(--outline); text-align: center; }
    .step.active span { color: var(--tertiary); font-weight: 700; }
    .step.completed span { color: var(--secondary); }
    .step-line { flex: 1; height: 2px; background: var(--outline-variant); transition: 0.3s; }
    .step-line.active { background: var(--secondary); }

    .d-body { padding: 20px; flex-grow: 1; }
    .d-body h3 { margin: 0 0 16px 0; font-size: 1.05rem; font-weight: 700; color: var(--on-surface); }
    .address-card { display: flex; gap: 12px; padding: 14px; background: var(--surface-container-low); border-radius: 12px; margin-bottom: 16px; border: 1px dashed var(--outline-variant); }
    .address-text { display: flex; flex-direction: column; gap: 2px; }
    .address-label { font-size: 0.6rem; color: var(--outline); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
    .address-value { font-size: 0.85rem; color: var(--on-surface); line-height: 1.4; }
    .info-row { display: flex; gap: 24px; margin-bottom: 16px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 0.6rem; color: var(--outline); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
    .info-value { font-size: 0.9rem; font-weight: 700; color: var(--on-surface); }
    .info-value.amount { color: var(--primary); }
    .d-notes { padding: 10px 14px; font-size: 0.85rem; }
    .d-footer { padding: 16px 20px; border-top: 1px solid var(--surface-container-low); background: var(--surface-container-low); }
    .btn-action { width: 100%; padding: 13px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Inter', sans-serif; }
    .btn-start { background: linear-gradient(135deg, var(--tertiary), var(--tertiary-container)); color: white; }
    .btn-start:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,69,152,0.25); }
    .btn-complete { background: linear-gradient(135deg, var(--secondary), #007432); color: white; }
    .btn-complete:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,110,47,0.25); }

    .empty-state { text-align: center; padding: 60px 40px; background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); }
    .empty-icon { font-size: 56px; color: var(--outline-variant); margin-bottom: 12px; }
    .empty-state h3 { margin-bottom: 8px; font-weight: 700; color: var(--on-surface); }
    .empty-state p { color: var(--outline); font-size: 0.875rem; }

    .history-panel { background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; }
    .history-item { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid var(--surface-container-low); transition: 0.2s; flex-wrap: wrap; gap: 12px; }
    .history-item:last-child { border-bottom: none; }
    .history-item:hover { background: var(--surface-container-low); }
    .history-left { display: flex; align-items: center; gap: 16px; }
    .history-id { font-family: monospace; color: var(--outline); font-size: 0.8rem; min-width: 70px; }
    .history-info { display: flex; flex-direction: column; gap: 2px; }
    .history-name { font-weight: 700; font-size: 0.9rem; color: var(--on-surface); }
    .history-addr { font-size: 0.7rem; color: var(--outline); display: flex; align-items: center; gap: 2px; }
    .history-right { display: flex; align-items: center; gap: 20px; }
    .history-amount { font-weight: 700; color: var(--primary); font-size: 0.95rem; }
    .history-date { font-size: 0.75rem; color: var(--outline); }
    .history-notes { font-size: 0.75rem; color: #b45309; font-style: italic; padding: 4px 10px; background: rgba(245,158,11,0.06); border-radius: 6px; display: flex; align-items: center; gap: 4px; }
    .empty-state-inline { text-align: center; padding: 40px; color: var(--outline); font-style: italic; }

    .confirm-dialog { width: 440px; padding: 36px; border-radius: 20px; text-align: center; background: var(--surface-container-lowest); box-shadow: var(--shadow-xl); }
    .confirm-icon { font-size: 48px; color: var(--primary); margin-bottom: 16px; }
    .confirm-dialog h3 { margin-bottom: 10px; font-size: 1.15rem; font-family: 'Manrope', sans-serif; color: var(--on-surface); }
    .confirm-dialog p { color: var(--on-surface-variant); font-size: 0.875rem; margin-bottom: 28px; line-height: 1.5; }
    .confirm-buttons { display: flex; gap: 12px; justify-content: center; }
  `]
})
export class DriverPanelComponent implements OnInit, OnDestroy {
  deliveries: Delivery[] = [];
  deliveryNotes: { [key: string]: string } = {};
  activeView: 'active' | 'history' = 'active';
  isConnected = false;
  showConfirmDialog = false;
  confirmAction = '';
  confirmDelivery: Delivery | null = null;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private subs: Subscription[] = [];
  get activeDeliveries(): Delivery[] { return this.deliveries.filter(d => d.status !== 'Delivered'); }
  get completedDeliveries(): Delivery[] { return this.deliveries.filter(d => d.status === 'Delivered').sort((a, b) => new Date(b.deliveredAt!).getTime() - new Date(a.deliveredAt!).getTime()); }
  get assignedCount(): number { return this.deliveries.filter(d => d.status === 'Assigned').length; }
  get inTransitCount(): number { return this.deliveries.filter(d => d.status === 'OutForDelivery').length; }
  get deliveredCount(): number { return this.deliveries.filter(d => d.status === 'Delivered').length; }
  get completedTodayCount(): number { const today = new Date().toDateString(); return this.deliveries.filter(d => d.status === 'Delivered' && d.deliveredAt && new Date(d.deliveredAt).toDateString() === today).length; }
  constructor(private api: ApiService, private signalR: SignalRService) {}
  ngOnInit() {
    this.loadDeliveries(); this.signalR.startConnection();
    this.subs.push(
      this.signalR.connectionState.subscribe(state => { this.isConnected = state === 'connected'; }),
      this.signalR.deliveryAssigned.subscribe(alert => { this.showToast(`New delivery: ${alert.wholesalerName}`, 'success'); this.loadDeliveries(); }),
      this.signalR.orderStatusChanged.subscribe(() => { this.loadDeliveries(); })
    );
  }
  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
  trackById(index: number, item: Delivery): string { return item.id; }
  loadDeliveries() { this.api.getDeliveries().subscribe(res => { this.deliveries = res; this.deliveries.forEach(d => { if (!this.deliveryNotes[d.id]) this.deliveryNotes[d.id] = d.notes || ''; }); }); }
  confirmStatusChange(d: Delivery, newStatus: string) { this.confirmDelivery = d; this.confirmAction = newStatus; this.showConfirmDialog = true; }
  executeStatusChange() {
    if (!this.confirmDelivery) return; const d = this.confirmDelivery; const notes = this.deliveryNotes[d.id]; this.showConfirmDialog = false;
    this.api.updateDeliveryStatus(d.id, { status: this.confirmAction, notes }).subscribe({ next: () => { const msg = this.confirmAction === 'Delivered' ? `Delivery to ${d.wholesalerName} completed!` : `Delivery to ${d.wholesalerName} started!`; this.showToast(msg, 'success'); this.loadDeliveries(); }, error: () => this.showToast('Failed to update status', 'error') });
  }
  showToast(message: string, type: 'success' | 'error') { this.toastMessage = message; this.toastType = type; setTimeout(() => this.toastMessage = '', 3500); }
}
