using Microsoft.EntityFrameworkCore;
using ProductService.Domain.Entities;

namespace ProductService.Infrastructure.Data;

public class ProductDbContext : DbContext
{
    public ProductDbContext(DbContextOptions<ProductDbContext> options) : base(options) { }
    public DbSet<ProductEntity> Products => Set<ProductEntity>();
    public DbSet<CategoryEntity> Categories => Set<CategoryEntity>();
    public DbSet<DiscountEntity> Discounts => Set<DiscountEntity>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<ProductEntity>().HasOne(p => p.Category).WithMany(c => c.Products).HasForeignKey(p => p.CategoryId);
        m.Entity<DiscountEntity>().HasOne<ProductEntity>().WithMany().HasForeignKey(d => d.ProductId);
        m.Entity<ProductEntity>().Property(p => p.Price).HasPrecision(18, 2);
        m.Entity<DiscountEntity>().Property(d => d.Percentage).HasPrecision(5, 2);
    }
}
