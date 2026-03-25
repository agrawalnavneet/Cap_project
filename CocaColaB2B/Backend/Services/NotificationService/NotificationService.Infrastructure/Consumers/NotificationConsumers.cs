using CocaColaB2B.Shared.Events;
using MassTransit;
using Microsoft.Extensions.Configuration;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Data;
using System.Net;
using System.Net.Mail;

namespace NotificationService.Infrastructure.Consumers;

public class OrderPlacedNotificationConsumer : IConsumer<OrderPlacedEvent>
{
    private readonly NotificationDbContext _db;
    private readonly IConfiguration _config;

    public OrderPlacedNotificationConsumer(NotificationDbContext db, IConfiguration config) { _db = db; _config = config; }

    public async Task Consume(ConsumeContext<OrderPlacedEvent> context)
    {
        var ev = context.Message;
        _db.Notifications.Add(new NotificationEntity { UserId = ev.WholesalerId, Message = $"Your order #{ev.OrderId.ToString()[..8]} has been placed! Total: ${ev.TotalAmount:N2}", Type = "OrderPlaced" });
        await _db.SaveChangesAsync();

        try
        {
            var host = _config["Email:SmtpHost"];
            if (string.IsNullOrEmpty(host)) return;
            using var client = new SmtpClient(host, int.Parse(_config["Email:SmtpPort"] ?? "587")) { Credentials = new NetworkCredential(_config["Email:Username"], _config["Email:Password"]), EnableSsl = true };
            var mail = new MailMessage(_config["Email:FromEmail"] ?? "noreply@cocacola-b2b.com", ev.WholesalerEmail, "Order Confirmation", $"<h2>Order Placed Successfully!</h2><p>Order #{ev.OrderId.ToString()[..8]}</p><p>Total: ${ev.TotalAmount:N2}</p>") { IsBodyHtml = true };
            await client.SendMailAsync(mail);
        }
        catch { }
    }
}

public class OrderStatusNotificationConsumer : IConsumer<OrderStatusChangedEvent>
{
    private readonly NotificationDbContext _db;
    public OrderStatusNotificationConsumer(NotificationDbContext db) => _db = db;

    public async Task Consume(ConsumeContext<OrderStatusChangedEvent> context)
    {
        var ev = context.Message;
        _db.Notifications.Add(new NotificationEntity { UserId = ev.WholesalerId, Message = $"Order #{ev.OrderId.ToString()[..8]} status changed to {ev.NewStatus}", Type = ev.NewStatus == "Approved" ? "OrderApproved" : ev.NewStatus == "Rejected" ? "OrderRejected" : "OrderUpdate" });
        if (ev.DriverId.HasValue)
        {
            _db.Notifications.Add(new NotificationEntity { UserId = ev.DriverId.Value, Message = $"New delivery assigned: Order #{ev.OrderId.ToString()[..8]}", Type = "DeliveryAssigned" });
        }
        await _db.SaveChangesAsync();
    }
}

public class LowStockNotificationConsumer : IConsumer<LowStockAlertEvent>
{
    private readonly NotificationDbContext _db;
    public LowStockNotificationConsumer(NotificationDbContext db) => _db = db;

    public async Task Consume(ConsumeContext<LowStockAlertEvent> context)
    {
        var ev = context.Message;
        _db.Notifications.Add(new NotificationEntity { UserId = Guid.Empty, Message = $"⚠️ Low stock alert: {ev.ProductName} — only {ev.CurrentStock} left (reorder at {ev.ReorderLevel})", Type = "LowStock" });
        await _db.SaveChangesAsync();
    }
}
