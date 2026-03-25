using Microsoft.EntityFrameworkCore;
using InventoryService.Domain.Entities;

namespace InventoryService.Infrastructure.Data;

public class InventoryDbContext : DbContext
{
    public InventoryDbContext(DbContextOptions<InventoryDbContext> options) : base(options) { }
    public DbSet<InventoryEntity> Inventories => Set<InventoryEntity>();
}
