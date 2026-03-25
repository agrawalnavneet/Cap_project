using Microsoft.EntityFrameworkCore;
using DeliveryService.Domain.Entities;

namespace DeliveryService.Infrastructure.Data;

public class DeliveryDbContext : DbContext
{
    public DeliveryDbContext(DbContextOptions<DeliveryDbContext> options) : base(options) { }
    public DbSet<DeliveryAssignmentEntity> DeliveryAssignments => Set<DeliveryAssignmentEntity>();
}
