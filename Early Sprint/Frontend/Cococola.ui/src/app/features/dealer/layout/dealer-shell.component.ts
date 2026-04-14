import { Component, signal } from '@angular/core';
import { SidebarItem } from '../../../shared/ui/sidebar/ccb2b-sidebar.component';

@Component({
  selector: 'app-dealer-shell',
  standalone: false,
  template: `
    <div class="dealer-shell" [class.collapsed]="sidebarCollapsed()">
      <ccb2b-sidebar
        [menuItems]="menuItems"
        [collapsed]="sidebarCollapsed()">
      </ccb2b-sidebar>

      <div class="main-wrapper">
        <app-dealer-topbar
          [sidebarCollapsed]="sidebarCollapsed()"
          (toggleSidebar)="sidebarCollapsed.set(!sidebarCollapsed())">
        </app-dealer-topbar>
        
        <main class="content-area">
          <div class="content-wrapper">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
      
      <app-cart-slideover></app-cart-slideover>
    </div>
  `,
  styles: [`
    .dealer-shell {
      display: flex;
      min-height: 100vh;
      background: var(--bg-card); // Or a very subtle neutral
    }

    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 0;
    }

    .collapsed .main-wrapper {
      margin-left: 80px;
    }

    .content-area {
      flex: 1;
      padding: 32px;
      overflow-x: hidden;
      background: var(--bg-subtle);
      border-radius: 32px 0 0 0; // Modern "card" layout feel for the main content
      margin-top: 0; // Topbar sits above
      min-height: calc(100vh - 72px);
    }

    .content-wrapper {
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    @media (max-width: 1024px) {
      .main-wrapper { margin-left: 0 !important; }
      .content-area { border-radius: 0; padding: 20px; }
    }
  `]
})
export class DealerShellComponent {
  sidebarCollapsed = signal(false);

  menuItems: SidebarItem[] = [
    { label: 'Home', route: '/dealer/dashboard', icon: 'home' },
    { label: 'Catalog', route: '/dealer/catalog', icon: 'package' },
    { label: 'My Orders', route: '/dealer/orders', icon: 'shopping-bag' },
    { label: 'Invoices', route: '/dealer/invoices', icon: 'receipt' },
    { label: 'Returns', route: '/dealer/returns', icon: 'rotate-ccw' },
    { label: 'Profile', route: '/dealer/profile', icon: 'user' },
  ];
}


