using Microsoft.EntityFrameworkCore;

namespace NotificationService.Data;

public class NotificationDbContext : DbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options) { }
    public DbSet<NotificationEntity> Notifications => Set<NotificationEntity>();
}

public class NotificationEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Message { get; set; } = "";
    public string Type { get; set; } = "General";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
