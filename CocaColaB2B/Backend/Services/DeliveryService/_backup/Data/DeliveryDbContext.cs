using Microsoft.EntityFrameworkCore;

namespace DeliveryService.Data;

public class DeliveryDbContext : DbContext
{
    public DeliveryDbContext(DbContextOptions<DeliveryDbContext> options) : base(options) { }
    public DbSet<DeliveryAssignmentEntity> DeliveryAssignments => Set<DeliveryAssignmentEntity>();
}

public class DeliveryAssignmentEntity
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid DriverId { get; set; }
    public string WholesalerName { get; set; } = "";
    public string ShippingAddress { get; set; } = "";
    public decimal OrderTotal { get; set; }
    public string Status { get; set; } = "Assigned"; // Assigned, PickedUp, InTransit, Delivered
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeliveredAt { get; set; }
    public string? Notes { get; set; }
}
