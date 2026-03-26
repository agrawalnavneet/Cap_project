export interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sku: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  quantityInStock: number;
  discountPercentage?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  productCount: number;
}

export interface Order {
  id: string;
  wholesalerId: string;
  wholesalerName: string;
  driverId?: string;
  driverName?: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  contactNumber?: string;
  address?: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  productPrice: number;
  quantity: number;
  subTotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  lowStockItems: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: RecentOrder[];
}

export interface RecentOrder {
  id: string;
  wholesalerName: string;
  totalAmount: number;
  status: string;
  orderDate: string;
}

export interface Notification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  wholesalerName: string;
  shippingAddress: string;
  orderTotal: number;
  status: string;
  assignedAt: string;
  deliveredAt?: string;
  notes?: string;
}

export interface Inventory {
  id: string;
  productId: string;
  productName: string;
  productSKU: string;
  quantityInStock: number;
  reorderLevel: number;
  lastUpdated: string;
  isLowStock: boolean;
}

export interface LoginResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}
