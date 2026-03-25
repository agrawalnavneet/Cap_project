using Microsoft.EntityFrameworkCore;

namespace InventoryService.Data;

public class InventoryDbContext : DbContext
{
    public InventoryDbContext(DbContextOptions<InventoryDbContext> options) : base(options) { }
    public DbSet<InventoryEntity> Inventories => Set<InventoryEntity>();
}

public class InventoryEntity
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public string ProductSKU { get; set; } = "";
    public int QuantityInStock { get; set; }
    public int ReorderLevel { get; set; } = 100;
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}
