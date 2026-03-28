import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, Category, Order, User, Cart, DashboardStats, Notification, Delivery, Inventory } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Products
  getProducts(): Observable<Product[]> { return this.http.get<Product[]>(`${this.api}/products`); }
  getProduct(id: string): Observable<Product> { return this.http.get<Product>(`${this.api}/products/${id}`); }
  createProduct(data: any): Observable<Product> { return this.http.post<Product>(`${this.api}/products`, data); }
  updateProduct(id: string, data: any): Observable<void> { return this.http.put<void>(`${this.api}/products/${id}`, data); }
  deleteProduct(id: string): Observable<void> { return this.http.delete<void>(`${this.api}/products/${id}`); }

  // Categories
  getCategories(): Observable<Category[]> { return this.http.get<Category[]>(`${this.api}/categories`); }
  createCategory(data: any): Observable<Category> { return this.http.post<Category>(`${this.api}/categories`, data); }
  updateCategory(id: string, data: any): Observable<void> { return this.http.put<void>(`${this.api}/categories/${id}`, data); }
  deleteCategory(id: string): Observable<void> { return this.http.delete<void>(`${this.api}/categories/${id}`); }

  // Orders
  getOrders(): Observable<Order[]> { return this.http.get<Order[]>(`${this.api}/orders`); }
  getOrder(id: string): Observable<Order> { return this.http.get<Order>(`${this.api}/orders/${id}`); }
  placeOrder(data: any): Observable<Order> { return this.http.post<Order>(`${this.api}/orders`, data); }
  updateOrderStatus(id: string, data: any): Observable<void> { return this.http.put<void>(`${this.api}/orders/${id}/status`, data); }

  // Users
  getUsers(): Observable<User[]> { return this.http.get<User[]>(`${this.api}/users`); }
  getUser(id: string): Observable<User> { return this.http.get<User>(`${this.api}/users/${id}`); }
  createUser(data: any): Observable<User> { return this.http.post<User>(`${this.api}/users`, data); }
  updateUser(id: string, data: any): Observable<void> { return this.http.put<void>(`${this.api}/users/${id}`, data); }
  deleteUser(id: string): Observable<void> { return this.http.delete<void>(`${this.api}/users/${id}`); }

  // Cart
  getCart(): Observable<Cart> { return this.http.get<Cart>(`${this.api}/cart`); }
  addToCart(data: any): Observable<void> { return this.http.post<void>(`${this.api}/cart`, data); }
  updateCartItem(itemId: string, data: any): Observable<void> { return this.http.put<void>(`${this.api}/cart/${itemId}`, data); }
  removeFromCart(itemId: string): Observable<void> { return this.http.delete<void>(`${this.api}/cart/${itemId}`); }
  clearCart(): Observable<void> { return this.http.delete<void>(`${this.api}/cart`); }

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> { return this.http.get<DashboardStats>(`${this.api}/dashboard/stats`); }

  // Inventory
  getInventory(): Observable<Inventory[]> { return this.http.get<Inventory[]>(`${this.api}/inventory`); }
  getLowStock(): Observable<Inventory[]> { return this.http.get<Inventory[]>(`${this.api}/inventory/low-stock`); }
  updateStock(productId: string, data: any): Observable<void> { return this.http.put<void>(`${this.api}/inventory/${productId}`, data); }

  // Delivery
  getDeliveries(): Observable<Delivery[]> { return this.http.get<Delivery[]>(`${this.api}/delivery`); }
  updateDeliveryStatus(id: string, data: any): Observable<void> { return this.http.put<void>(`${this.api}/delivery/${id}/status`, data); }

  // Notifications
  getNotifications(): Observable<Notification[]> { return this.http.get<Notification[]>(`${this.api}/notifications`); }
  markNotificationRead(id: string): Observable<void> { return this.http.put<void>(`${this.api}/notifications/${id}/read`, {}); }
  markAllNotificationsRead(): Observable<void> { return this.http.put<void>(`${this.api}/notifications/read-all`, {}); }
}
