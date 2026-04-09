using Microsoft.EntityFrameworkCore;
using OrderService.Domain.Entities;

namespace OrderService.Infrastructure.Data;

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
        m.Entity<CartItemEntity>().Property(ci => ci.ProductPrice).HasPrecision(18, 2);
    }
}
