import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api.service';
import { SignalRService } from '../services/signalr.service';
import { Notification } from '../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any;
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;
  private subs: Subscription[] = [];

  menuItems: { label: string; path: string; icon: string }[] = [];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private signalRService: SignalRService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      this.setupMenu();
      this.loadNotifications();
      this.signalRService.startConnection();

      // Subscribe to SignalR events for real-time notification refresh
      this.subs.push(
        this.signalRService.orderStatusChanged.subscribe(() => {
          this.loadNotifications();
        }),
        this.signalRService.newOrderReceived.subscribe(() => {
          this.loadNotifications();
        }),
        this.signalRService.deliveryAssigned.subscribe(() => {
          this.loadNotifications();
        })
      );
    } else {
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy() {
    // Clean up all subscriptions and stop SignalR connection
    this.subs.forEach(s => s.unsubscribe());
    this.signalRService.stopConnection();
  }

  setupMenu() {
    const role = this.user?.role || this.user?.Role;
    switch (role) {
      case 'Admin':
        this.menuItems = [
          { label: 'Dashboard', path: '/dashboard/home', icon: 'dashboard' },
          { label: 'Products', path: '/dashboard/products', icon: 'inventory_2' },
          { label: 'Categories', path: '/dashboard/categories', icon: 'category' },
          { label: 'Orders', path: '/dashboard/orders', icon: 'receipt_long' },
          { label: 'Users', path: '/dashboard/users', icon: 'group' },
          { label: 'Inventory', path: '/dashboard/inventory', icon: 'warehouse' },
        ];
        break;
      case 'Wholesaler':
        this.menuItems = [
          { label: 'Catalog', path: '/dashboard/wholesaler-catalog', icon: 'storefront' },
          { label: 'My Cart', path: '/dashboard/cart', icon: 'shopping_cart' },
          { label: 'My Orders', path: '/dashboard/my-orders', icon: 'receipt_long' },
        ];
        break;
      case 'WarehouseManager':
        this.menuItems = [
          { label: 'Order Management', path: '/dashboard/warehouse-orders', icon: 'assignment' },
          { label: 'Inventory', path: '/dashboard/warehouse-inventory', icon: 'inventory' },
          { label: 'Manage Drivers', path: '/dashboard/users', icon: 'group' },
        ];
        break;
      case 'Driver':
        this.menuItems = [
          { label: 'My Deliveries', path: '/dashboard/deliveries', icon: 'local_shipping' },
        ];
        break;
    }
  }

  loadNotifications() {
    this.apiService.getNotifications().subscribe({
      next: (n) => {
        this.notifications = n;
        this.unreadCount = n.filter(x => !x.isRead).length;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAllRead() {
    this.apiService.markAllNotificationsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.unreadCount = 0;
    });
  }

  getPageTitle(): string {
    const currentPath = this.router.url;
    const item = this.menuItems.find(m => currentPath.includes(m.path));
    return item ? item.label : 'Dashboard';
  }

  getUserInitial(): string {
    const name = this.user?.fullName || this.user?.FullName || 'U';
    return name.charAt(0).toUpperCase();
  }

  formatRole(role: string): string {
    if (role === 'WarehouseManager') return 'Warehouse Manager';
    return role;
  }

  logout() {
    this.signalRService.stopConnection();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
