using Microsoft.EntityFrameworkCore;

namespace ProductService.Data;

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

public class ProductEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string SKU { get; set; } = "";
    public decimal Price { get; set; }
    public Guid CategoryId { get; set; }
    public CategoryEntity Category { get; set; } = null!;
}

public class CategoryEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public ICollection<ProductEntity> Products { get; set; } = new List<ProductEntity>();
}

public class DiscountEntity
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public decimal Percentage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive => DateTime.UtcNow >= StartDate && DateTime.UtcNow <= EndDate;
}
