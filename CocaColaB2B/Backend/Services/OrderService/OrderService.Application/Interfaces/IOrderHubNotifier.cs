namespace OrderService.Application.Interfaces;

public interface IOrderHubNotifier
{
    Task NotifyOrderStatusChanged(Guid orderId, string newStatus, Guid wholesalerId, Guid? driverId, string? driverName, CancellationToken cancellationToken = default);
    Task NotifyNewOrderReceived(string orderId, string wholesalerName, decimal totalAmount, DateTime orderDate, CancellationToken cancellationToken = default);
    Task NotifyDeliveryAssigned(Guid driverId, string orderId, string wholesalerName, string shippingAddress, decimal orderTotal, CancellationToken cancellationToken = default);
}
