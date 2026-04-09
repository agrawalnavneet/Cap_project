using Microsoft.AspNetCore.SignalR;
using OrderService.Application.Interfaces;

namespace OrderService.API.Services;

public class OrderHubNotifier : IOrderHubNotifier
{
    private readonly IHubContext<Hubs.OrderHub> _hubContext;

    public OrderHubNotifier(IHubContext<Hubs.OrderHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyOrderStatusChanged(Guid orderId, string newStatus, Guid wholesalerId, Guid? driverId, string? driverName, CancellationToken cancellationToken = default)
    {
        var update = new
        {
            orderId = orderId.ToString(),
            newStatus,
            driverName = driverName ?? "",
            changedAt = DateTime.UtcNow.ToString("o")
        };

        // Notify the wholesaler who placed the order
        await _hubContext.Clients.Group($"user-{wholesalerId}").SendAsync("OrderStatusChanged", update, cancellationToken);
        // Notify all admins
        await _hubContext.Clients.Group("role-Admin").SendAsync("OrderStatusChanged", update, cancellationToken);
        // Notify all warehouse managers
        await _hubContext.Clients.Group("role-WarehouseManager").SendAsync("OrderStatusChanged", update, cancellationToken);
        // Notify the assigned driver
        if (driverId.HasValue)
            await _hubContext.Clients.Group($"user-{driverId}").SendAsync("OrderStatusChanged", update, cancellationToken);
    }

    public async Task NotifyNewOrderReceived(string orderId, string wholesalerName, decimal totalAmount, DateTime orderDate, CancellationToken cancellationToken = default)
    {
        var alert = new
        {
            orderId,
            wholesalerName,
            totalAmount,
            orderDate = orderDate.ToString("o")
        };

        await _hubContext.Clients.Group("role-Admin").SendAsync("NewOrderReceived", alert, cancellationToken);
        await _hubContext.Clients.Group("role-WarehouseManager").SendAsync("NewOrderReceived", alert, cancellationToken);
    }

    public async Task NotifyDeliveryAssigned(Guid driverId, string orderId, string wholesalerName, string shippingAddress, decimal orderTotal, CancellationToken cancellationToken = default)
    {
        var alert = new
        {
            orderId,
            wholesalerName,
            shippingAddress,
            orderTotal
        };

        await _hubContext.Clients.Group($"user-{driverId}").SendAsync("DeliveryAssigned", alert, cancellationToken);
    }
}
