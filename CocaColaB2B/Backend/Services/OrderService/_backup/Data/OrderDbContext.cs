using Microsoft.EntityFrameworkCore;

namespace OrderService.Data;

public class OrderDbContext : DbContext
{
    public OrderDbContext(DbContextOptions<OrderDbContext> options) : base(options) { }

    public DbSet<OrderEntity> Orders => Set<OrderEntity>();
    public DbSet<OrderItemEntity> OrderItems => Set<OrderItemEntity>();
    public DbSet<CartEntity> Carts => Set<CartEntity>();
    public DbSet<CartItemEntity> CartItems => Set<CartItemEntity>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<OrderItemEntity>().HasOne(oi => oi.Order).WithMany(o => o.Items).HasForeignKey(oi => oi.OrderId);
        m.Entity<CartItemEntity>().HasOne(ci => ci.Cart).WithMany(c => c.Items).HasForeignKey(ci => ci.CartId);
        m.Entity<OrderEntity>().Property(o => o.TotalAmount).HasPrecision(18, 2);
        m.Entity<OrderItemEntity>().Property(oi => oi.UnitPrice).HasPrecision(18, 2);
    }
}

public class OrderEntity
{
    public Guid Id { get; set; }
    public Guid WholesalerId { get; set; }
    public string WholesalerName { get; set; } = "";
    public string WholesalerEmail { get; set; } = "";
    public Guid? DriverId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public string ShippingAddress { get; set; } = "";
    public ICollection<OrderItemEntity> Items { get; set; } = new List<OrderItemEntity>();
}

public class OrderItemEntity
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public OrderEntity Order { get; set; } = null!;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class CartEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<CartItemEntity> Items { get; set; } = new List<CartItemEntity>();
}

public class CartItemEntity
{
    public Guid Id { get; set; }
    public Guid CartId { get; set; }
    public CartEntity Cart { get; set; } = null!;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public decimal ProductPrice { get; set; }
    public int Quantity { get; set; }
}
