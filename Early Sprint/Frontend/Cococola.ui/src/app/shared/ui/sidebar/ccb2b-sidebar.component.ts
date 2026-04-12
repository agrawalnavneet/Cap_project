import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface SidebarItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
  children?: SidebarItem[];
}

@Component({
  selector: 'ccb2b-sidebar',
  standalone: false,
  template: `
    <aside class="sidebar" [class.sidebar--collapsed]="collapsed">
      <div class="sidebar__header">
        <div class="logo">
           <div class="logo-icon">C</div>
           <span class="logo-text" *ngIf="!collapsed">Coca-Cola <span class="accent">B2B</span></span>
        </div>
      </div>

      <nav class="sidebar__nav">
        @for (item of menuItems; track item.label) {
          <div class="nav-group">
            <a [routerLink]="item.route" 
               routerLinkActive="active" 
               [routerLinkActiveOptions]="{exact: item.route === '/dealer/dashboard'}"
               class="nav-item"
               [title]="collapsed ? item.label : ''">
              <i-lucide [name]="item.icon" [size]="20" class="nav-icon"></i-lucide>
              <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
              <span class="nav-badge" *ngIf="!collapsed && item.badge">{{ item.badge }}</span>
            </a>
          </div>
        }
      </nav>

      <div class="sidebar__footer">
        <div class="user-pill" *ngIf="!collapsed">
          <div class="avatar">{{ getInitials() }}</div>
          <div class="info">
            <p class="name">{{ authService.currentUser()?.fullName }}</p>
            <p class="role">{{ authService.userRole() }}</p>
          </div>
          <button class="logout-btn" (click)="onLogout()">
            <i-lucide name="log-out" [size]="16"></i-lucide>
          </button>
        </div>
        <button class="collapse-toggle" *ngIf="collapsed" (click)="onLogout()">
           <i-lucide name="log-out" [size]="20"></i-lucide>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      background: var(--bg-card);
      border-right: 1px solid var(--border-default);
      display: flex;
      flex-direction: column;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;

      &--collapsed {
        width: 80px;
      }
    }

    .sidebar__header {
      height: 72px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--border-default);

      .logo {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .logo-icon {
          width: 32px;
          height: 32px;
          background: var(--hul-primary);
          border-radius: 8px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
        }

        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          .accent { color: var(--hul-primary); }
        }
      }
    }

    .sidebar__nav {
      flex: 1;
      padding: 24px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      color: var(--text-tertiary);
      text-decoration: none;
      transition: all 0.2s ease;
      font-weight: 500;

      &:hover {
        background: var(--bg-muted);
        color: var(--text-primary);
      }

      &.active {
        background: var(--hul-primary-light);
        color: var(--hul-primary);
        font-weight: 600;
        
        .nav-icon { color: var(--hul-primary); }
      }
    }

    .nav-icon { color: var(--text-tertiary); transition: color 0.2s; }
    .nav-label { font-size: 14px; flex: 1; margin-left: 2px; }
    
    .nav-badge {
      background: var(--hul-primary);
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
    }

    .sidebar__footer {
      padding: 16px;
      border-top: 1px solid var(--border-default);

      .user-pill {
        background: var(--bg-muted);
        padding: 8px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        gap: 10px;

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 12px;
          background: var(--hul-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .info {
          flex: 1;
          min-width: 0;
          .name { font-size: 13px; font-weight: 600; margin: 0; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .role { font-size: 10px; font-weight: 700; margin: 0; color: var(--text-tertiary); text-transform: uppercase; }
        }

        .logout-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          &:hover { background: #fef2f2; color: #ef4444; }
        }
      }

      .collapse-toggle {
        width: 100%;
        padding: 12px;
        border: none;
        background: transparent;
        color: var(--text-tertiary);
        cursor: pointer;
        &:hover { color: #ef4444; }
      }
    }

    @media (max-width: 1024px) {
      .sidebar { transform: translateX(-100%); }
    }
  `]
})
export class CcbSidebarComponent {
  @Input() menuItems: SidebarItem[] = [];
  // Alias input 'items' to support shell bindings ([items]="sidebarItems")
  @Input() set items(v: SidebarItem[]) { this.menuItems = v; }
  // Additional contextual inputs (accepted, drive CSS theming)
  @Input() brandLabel = '';
  @Input() sidebarClass = '';
  @Input() collapsed = false;
  @Output() logoutClicked = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  authService = inject(AuthService);

  getInitials(): string {
    const name = this.authService.currentUser()?.fullName || 'User';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  onLogout(): void {
    this.logoutClicked.emit();
    this.authService.logout();
  }
}

