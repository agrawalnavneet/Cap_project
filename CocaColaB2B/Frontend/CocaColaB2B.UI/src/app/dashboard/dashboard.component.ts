import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Notification } from '../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user: any;
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;

  menuItems: { label: string; path: string; icon: string }[] = [];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      this.setupMenu();
      this.loadNotifications();
    } else {
      this.router.navigate(['/login']);
    }
  }

  setupMenu() {
    const role = this.user?.role || this.user?.Role;
    switch (role) {
      case 'Admin':
        this.menuItems = [
          { label: 'Dashboard', path: '/dashboard/home', icon: '📊' },
          { label: 'Products', path: '/dashboard/products', icon: '📦' },
          { label: 'Categories', path: '/dashboard/categories', icon: '🏷️' },
          { label: 'Orders', path: '/dashboard/orders', icon: '📋' },
          { label: 'Users', path: '/dashboard/users', icon: '👥' },
          { label: 'Inventory', path: '/dashboard/inventory', icon: '🏭' },
        ];
        break;
      case 'Wholesaler':
        this.menuItems = [
          { label: 'Catalog', path: '/dashboard/wholesaler-catalog', icon: '🛍️' },
          { label: 'My Cart', path: '/dashboard/cart', icon: '🛒' },
          { label: 'My Orders', path: '/dashboard/my-orders', icon: '📋' },
        ];
        break;
      case 'WarehouseManager':
        this.menuItems = [
          { label: 'Pending Orders', path: '/dashboard/warehouse-orders', icon: '📋' },
          { label: 'Inventory', path: '/dashboard/warehouse-inventory', icon: '🏭' },
        ];
        break;
      case 'Driver':
        this.menuItems = [
          { label: 'My Deliveries', path: '/dashboard/deliveries', icon: '🚚' },
        ];
        break;
    }
  }

  loadNotifications() {
    this.apiService.getNotifications().subscribe({
      next: (n) => {
        this.notifications = n;
        this.unreadCount = n.filter(x => !x.isRead).length;
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
