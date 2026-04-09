import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
  { path: 'verify-otp', loadComponent: () => import('./verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent) },
  { 
    path: 'dashboard', 
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./dashboard/admin-home/admin-home.component').then(m => m.AdminHomeComponent) },
      { path: 'products', loadComponent: () => import('./dashboard/admin-products/admin-products.component').then(m => m.AdminProductsComponent) },
      { path: 'users', loadComponent: () => import('./dashboard/admin-users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'orders', loadComponent: () => import('./dashboard/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent) },
      { path: 'inventory', loadComponent: () => import('./dashboard/admin-inventory/admin-inventory.component').then(m => m.AdminInventoryComponent) },
      { path: 'categories', loadComponent: () => import('./dashboard/admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent) },
      { path: 'wholesaler-catalog', loadComponent: () => import('./dashboard/wholesaler-catalog/wholesaler-catalog.component').then(m => m.WholesalerCatalogComponent) },
      { path: 'warehouse-manager', loadComponent: () => import('./dashboard/warehouse-manager/warehouse-manager.component').then(m => m.WarehouseManagerComponent) },
      { path: 'warehouse-orders', loadComponent: () => import('./dashboard/warehouse-orders/warehouse-orders.component').then(m => m.WarehouseOrdersComponent) },
      { path: 'warehouse-inventory', loadComponent: () => import('./dashboard/warehouse-inventory/warehouse-inventory.component').then(m => m.WarehouseInventoryComponent) },
      { path: 'driver-panel', loadComponent: () => import('./dashboard/driver-panel/driver-panel.component').then(m => m.DriverPanelComponent) },
      { path: 'deliveries', loadComponent: () => import('./dashboard/driver-panel/driver-panel.component').then(m => m.DriverPanelComponent) },
      { path: 'cart', loadComponent: () => import('./dashboard/wholesaler-cart/wholesaler-cart.component').then(m => m.WholesalerCartComponent) },
      { path: 'my-orders', loadComponent: () => import('./dashboard/wholesaler-orders/wholesaler-orders.component').then(m => m.WholesalerOrdersComponent) }
    ]
  }
];
