import { Component, Input } from '@angular/core';

@Component({
  selector: 'ccb2b-badge',
  standalone: false,
  template: `
    <span class="ccb2b-badge" [ngClass]="'ccb2b-badge--' + variant + ' ccb2b-badge--' + size">
      <span *ngIf="dot" class="ccb2b-badge__dot"></span>
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    .ccb2b-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 9999px;
      font-family: var(--font-body);
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: 0.01em;
    }

    .ccb2b-badge--sm { padding: 2px 8px; font-size: 11px; }
    .ccb2b-badge--md { padding: 4px 12px; font-size: 13px; }

    .ccb2b-badge--success { background: #ecfdf5; color: #059669; }
    .ccb2b-badge--warning { background: #fffbeb; color: #d97706; }
    .ccb2b-badge--danger  { background: #fef2f2; color: #dc2626; }
    .ccb2b-badge--info    { background: #eff6ff; color: #2563eb; }
    .ccb2b-badge--neutral { background: var(--bg-muted); color: var(--text-tertiary); }
    .ccb2b-badge--primary { background: var(--hul-primary-light); color: var(--hul-primary); }

    :host-context(.dark) .ccb2b-badge--success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    :host-context(.dark) .ccb2b-badge--warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    :host-context(.dark) .ccb2b-badge--danger  { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    :host-context(.dark) .ccb2b-badge--info    { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    :host-context(.dark) .ccb2b-badge--neutral { background: rgba(100, 116, 139, 0.15); color: #94a3b8; }
    :host-context(.dark) .ccb2b-badge--primary { background: rgba(3, 105, 161, 0.15); color: #38bdf8; }

    .ccb2b-badge__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse-dot 2s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.5); }
    }
  `]
})
export class CcbBadgeComponent {
  @Input() variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' = 'neutral';
  @Input() size: 'sm' | 'md' = 'sm';
  @Input() dot = false;
}
