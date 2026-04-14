import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-dealer-topbar',
  standalone: false,
  template: `
    <header class="topbar glass-nav">
      <div class="topbar__left">
        <button class="topbar__hamburger" (click)="toggleSidebar.emit()">
          <i-lucide name="menu" [size]="20"></i-lucide>
        </button>
      </div>

      <div class="topbar__center">
        <label class="topbar__search">
          <i-lucide name="search" [size]="18" class="search-icon"></i-lucide>
          <input type="text" placeholder="Search products, orders, invoices..." class="topbar__search-input" />
          <span class="search-kbd">⌘K</span>
        </label>
      </div>

      <div class="topbar__right">
        <!-- Theme toggle -->
        <button class="topbar__icon-btn" (click)="themeService.toggle()" [title]="themeService.isDark() ? 'Light mode' : 'Dark mode'">
          <i-lucide [name]="themeService.isDark() ? 'sun' : 'moon'" [size]="20"></i-lucide>
        </button>

        <!-- Notification bell -->
        <app-notification-bell></app-notification-bell>

        <!-- Cart Indicator -->
        <button class="topbar__icon-btn cart-btn" (click)="onCartToggle()">
          <i-lucide name="shopping-cart" [size]="20"></i-lucide>
          <span class="cart-badge" *ngIf="cartCount() > 0" [class.bounce]="cartCount() > 0">
            {{ cartCount() }}
          </span>
        </button>

        <div class="divider"></div>

        <!-- User profile -->
        <div class="topbar__user" (click)="showDropdown = !showDropdown">
          <div class="user-info">
            <span class="user-name">{{ userName() }}</span>
            <span class="user-role">{{ userRole() }}</span>
          </div>
          <div class="topbar__avatar">
            {{ getInitials() }}
          </div>
          
          <div class="topbar__dropdown glass-card" *ngIf="showDropdown">
            <div class="dropdown-header">
              <p class="email">{{ authService.currentUser()?.email }}</p>
            </div>
            <a routerLink="/dealer/profile" class="topbar__dropdown-item">
              <i-lucide name="user" [size]="16"></i-lucide> Profile
            </a>
            <a routerLink="/dealer/orders" class="topbar__dropdown-item">
              <i-lucide name="package" [size]="16"></i-lucide> My Orders
            </a>
            <div class="dropdown-divider"></div>
            <button class="topbar__dropdown-item logout-btn" (click)="onLogout()">
              <i-lucide name="log-out" [size]="16"></i-lucide> Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      gap: 24px;
    }

    .glass-nav {
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      border-bottom: 1px solid var(--glass-border);
    }

    .topbar__hamburger {
      background: var(--bg-muted);
      border: 1px solid var(--border-default);
      color: var(--text-secondary);
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      &:hover { background: var(--bg-subtle); color: var(--hul-primary); border-color: var(--hul-primary-light); }
    }

    .topbar__center { flex: 1; max-width: 600px; }

    .topbar__search {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-muted);
      border: 1px solid transparent;
      padding: 0 16px;
      height: 44px;
      border-radius: 12px;
      transition: all 0.2s ease;
      cursor: text;

      &:focus-within {
        background: var(--bg-card);
        border-color: var(--hul-primary);
        box-shadow: 0 0 0 4px var(--hul-primary-light);
      }

      .search-icon { color: var(--text-tertiary); }
      .search-kbd {
        font-size: 10px;
        font-weight: 700;
        background: var(--border-strong);
        color: var(--text-tertiary);
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    .topbar__search-input {
      flex: 1;
      border: none;
      background: none;
      font-size: 14px;
      color: var(--text-primary);
      outline: none;
      &::placeholder { color: var(--text-disabled); }
    }

    .topbar__right { display: flex; align-items: center; gap: 8px; }

    .topbar__icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;

      &:hover { background: var(--bg-muted); color: var(--text-primary); }

      &.cart-btn {
        background: var(--hul-primary-light);
        color: var(--hul-primary);
        &:hover { background: var(--hul-primary-hover); color: white; }
      }
    }

    .cart-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: 800;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--bg-card);
      &.bounce { animation: mini-bounce 0.3s ease; }
    }

    .divider { width: 1px; height: 24px; background: var(--border-default); margin: 0 8px; }

    .topbar__user {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 6px 6px 6px 12px;
      border-radius: 12px;
      transition: background 0.2s ease;
      position: relative;
      &:hover { background: var(--bg-muted); }

      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        .user-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .user-role { font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; }
      }
    }

    .topbar__avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--hul-primary), var(--hul-primary-hover));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
    }

    .topbar__dropdown {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      width: 220px;
      padding: 8px;
      z-index: 100;
      animation: slideInUp 0.2s var(--ease-out);

      .dropdown-header { padding: 8px 12px; .email { font-size: 12px; color: var(--text-tertiary); margin: 0; } }
      .dropdown-divider { height: 1px; background: var(--border-default); margin: 8px; }
    }

    .topbar__dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      background: none;
      border: none;
      width: 100%;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover { background: var(--bg-muted); color: var(--text-primary); }
      &.logout-btn:hover { background: #fef2f2; color: #ef4444; }
    }

    @keyframes mini-bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.4); }
    }

    @media (max-width: 768px) {
      .topbar__center, .user-info { display: none; }
    }
  `]
})
export class DealerTopbarComponent {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  private cartService = inject(CartService);
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);

  cartCount = this.cartService.count;
  userName = computed(() => this.authService.currentUser()?.fullName || 'Partner');
  userRole = computed(() => this.authService.userRole()?.toLowerCase() || 'member');

  showDropdown = false;

  getInitials(): string {
    const name = this.authService.currentUser()?.fullName || 'User';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  onCartToggle() { this.cartService.toggleCart(); }
  onLogout() { this.authService.logout(); }
}

