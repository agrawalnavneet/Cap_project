namespace NotificationService.Domain.Entities;

public class NotificationEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Message { get; set; } = "";
    public string Type { get; set; } = "General";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
