namespace CocaColaB2B.Shared.DTOs;

// ──── Auth DTOs ────
public class LoginRequestDto { public string Email { get; set; } = ""; public string Password { get; set; } = ""; }
public class LoginResponseDto { public string Token { get; set; } = ""; public string Email { get; set; } = ""; public string FullName { get; set; } = ""; public string Role { get; set; } = ""; }

public class RegisterRequest
{
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    // Wholesaler-specific (required for Wholesaler registration)
    public string? EnterpriseName { get; set; }
    public string? GstinNumber { get; set; }
}

public class RegisterResponseDto { public bool Success { get; set; } public string Message { get; set; } = ""; public string Email { get; set; } = ""; }

// ──── OTP DTOs ────
public class SendOtpRequest { public string Email { get; set; } = ""; }
public class VerifyOtpRequest { public string Email { get; set; } = ""; public string OtpCode { get; set; } = ""; }
public class ResendOtpRequest { public string Email { get; set; } = ""; }

// ──── User DTOs ────
public class UserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    // Wholesaler fields
    public string? EnterpriseName { get; set; }
    public string? GstinNumber { get; set; }
    public int CreditPoints { get; set; }
    public int WeeklyUnitsPurchased { get; set; }
    // Driver fields
    public string? VehicleType { get; set; }
}

public class CreateUserRequest
{
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string Role { get; set; } = "";
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    // Wholesaler fields
    public string? EnterpriseName { get; set; }
    public string? GstinNumber { get; set; }
    // Driver fields
    public string? VehicleType { get; set; }
}

public class UpdateUserRequest
{
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    // Wholesaler fields
    public string? EnterpriseName { get; set; }
    public string? GstinNumber { get; set; }
    // Driver fields
    public string? VehicleType { get; set; }
}

/// <summary>Admin grants credit points to a wholesaler.</summary>
public class GrantCreditPointsRequest { public int Points { get; set; } }

// ──── Product DTOs ────
public class ProductDto { public Guid Id { get; set; } public string Name { get; set; } = ""; public string? Description { get; set; } public string? ImageUrl { get; set; } public string SKU { get; set; } = ""; public decimal Price { get; set; } public Guid CategoryId { get; set; } public string? CategoryName { get; set; } public int QuantityInStock { get; set; } public decimal? DiscountPercentage { get; set; } }
public class CreateProductRequest { public string Name { get; set; } = ""; public string? Description { get; set; } public string? ImageUrl { get; set; } public string SKU { get; set; } = ""; public decimal Price { get; set; } public Guid CategoryId { get; set; } public int InitialStock { get; set; } }
public class UpdateProductRequest { public string Name { get; set; } = ""; public string? Description { get; set; } public string? ImageUrl { get; set; } public string SKU { get; set; } = ""; public decimal Price { get; set; } public Guid CategoryId { get; set; } }

// ──── Category DTOs ────
public class CategoryDto { public Guid Id { get; set; } public string Name { get; set; } = ""; public string? Description { get; set; } public int ProductCount { get; set; } }
public class CreateCategoryRequest { public string Name { get; set; } = ""; public string? Description { get; set; } }

// ──── Order DTOs ────
public class OrderDto { public Guid Id { get; set; } public Guid WholesalerId { get; set; } public string WholesalerName { get; set; } = ""; public Guid? DriverId { get; set; } public string? DriverName { get; set; } public DateTime OrderDate { get; set; } public decimal TotalAmount { get; set; } public string Status { get; set; } = ""; public string ShippingAddress { get; set; } = ""; public string? PaymentId { get; set; } public string PaymentStatus { get; set; } = "Unpaid"; public List<OrderItemDto> Items { get; set; } = new(); }
public class OrderItemDto { public Guid Id { get; set; } public Guid ProductId { get; set; } public string ProductName { get; set; } = ""; public string? ProductImageUrl { get; set; } public int Quantity { get; set; } public decimal UnitPrice { get; set; } public decimal TotalPrice { get; set; } }
public class PlaceOrderRequest { public string ShippingAddress { get; set; } = ""; public List<OrderItemRequest> Items { get; set; } = new(); }
public class OrderItemRequest { public Guid ProductId { get; set; } public int Quantity { get; set; } }
public class UpdateOrderStatusRequest { public string Status { get; set; } = ""; public Guid? DriverId { get; set; } }

// ──── Cart DTOs ────
public class CartDto { public Guid Id { get; set; } public List<CartItemDto> Items { get; set; } = new(); public decimal TotalAmount { get; set; } public int TotalItems { get; set; } }
public class CartItemDto { public Guid Id { get; set; } public Guid ProductId { get; set; } public string ProductName { get; set; } = ""; public string? ProductImageUrl { get; set; } public decimal ProductPrice { get; set; } public int Quantity { get; set; } public decimal SubTotal { get; set; } }
public class AddToCartRequest { public Guid ProductId { get; set; } public int Quantity { get; set; } = 10; public string ProductName { get; set; } = ""; public decimal ProductPrice { get; set; } }
public class UpdateCartItemRequest { public int Quantity { get; set; } }

// ──── Dashboard DTOs ────
public class DashboardStatsDto { public int TotalOrders { get; set; } public int PendingOrders { get; set; } public int LowStockItems { get; set; } public decimal TotalRevenue { get; set; } public int TotalProducts { get; set; } public int TotalUsers { get; set; } public List<RecentOrderDto> RecentOrders { get; set; } = new(); }
public class RecentOrderDto { public Guid Id { get; set; } public string WholesalerName { get; set; } = ""; public decimal TotalAmount { get; set; } public string Status { get; set; } = ""; public DateTime OrderDate { get; set; } }

// ──── Inventory DTOs ────
public class InventoryDto { public Guid Id { get; set; } public Guid ProductId { get; set; } public string ProductName { get; set; } = ""; public string ProductSKU { get; set; } = ""; public int QuantityInStock { get; set; } public int ReorderLevel { get; set; } public DateTime LastUpdated { get; set; } public bool IsLowStock => QuantityInStock <= ReorderLevel; }
public class UpdateStockRequest { public int QuantityInStock { get; set; } public int? ReorderLevel { get; set; } }

// ──── Notification DTOs ────
public class NotificationDto { public Guid Id { get; set; } public string Message { get; set; } = ""; public string Type { get; set; } = ""; public bool IsRead { get; set; } public DateTime CreatedAt { get; set; } }

// ──── Delivery DTOs ────
public class DeliveryDto { public Guid Id { get; set; } public Guid OrderId { get; set; } public string WholesalerName { get; set; } = ""; public string ShippingAddress { get; set; } = ""; public decimal OrderTotal { get; set; } public string Status { get; set; } = ""; public DateTime AssignedAt { get; set; } public DateTime? DeliveredAt { get; set; } public string? Notes { get; set; } }
public class UpdateDeliveryStatusRequest { public string Status { get; set; } = ""; public string? Notes { get; set; } }

// ──── Discount DTOs ────
public class DiscountDto { public Guid Id { get; set; } public Guid ProductId { get; set; } public string ProductName { get; set; } = ""; public decimal Percentage { get; set; } public DateTime StartDate { get; set; } public DateTime EndDate { get; set; } public bool IsActive { get; set; } }
public class CreateDiscountRequest { public Guid ProductId { get; set; } public decimal Percentage { get; set; } public DateTime StartDate { get; set; } public DateTime EndDate { get; set; } }

// ──── Payment DTOs ────
public class PaymentDto { public Guid Id { get; set; } public Guid OrderId { get; set; } public decimal Amount { get; set; } public string Currency { get; set; } = "INR"; public string? RazorpayOrderId { get; set; } public string? RazorpayPaymentId { get; set; } public string Status { get; set; } = ""; public DateTime CreatedAt { get; set; } public DateTime? UpdatedAt { get; set; } }
public class CreatePaymentRequest { public Guid OrderId { get; set; } public decimal Amount { get; set; } public string Currency { get; set; } = "INR"; }
public class VerifyPaymentRequest { public Guid PaymentId { get; set; } public string RazorpayPaymentId { get; set; } = ""; public string RazorpayOrderId { get; set; } = ""; public string RazorpaySignature { get; set; } = ""; }
