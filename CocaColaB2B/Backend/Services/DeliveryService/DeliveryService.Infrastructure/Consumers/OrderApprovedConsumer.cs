using CocaColaB2B.Shared.Events;
using DeliveryService.Domain.Entities;
using DeliveryService.Infrastructure.Data;
using MassTransit;

namespace DeliveryService.Infrastructure.Consumers;

public class OrderApprovedConsumer : IConsumer<OrderStatusChangedEvent>
{
    private readonly DeliveryDbContext _db;
    public OrderApprovedConsumer(DeliveryDbContext db) => _db = db;

    public async Task Consume(ConsumeContext<OrderStatusChangedEvent> context)
    {
        var ev = context.Message;
        if (ev.NewStatus == "Approved" && ev.DriverId.HasValue)
        {
            _db.DeliveryAssignments.Add(new DeliveryAssignmentEntity
            {
                OrderId = ev.OrderId,
                DriverId = ev.DriverId.Value,
                // BUG-2 FIX: Now populated from the enriched event
                WholesalerName = ev.WholesalerName,
                ShippingAddress = ev.ShippingAddress,
                OrderTotal = ev.OrderTotal,
                Status = "Assigned"
            });
            await _db.SaveChangesAsync();
            Console.WriteLine($"[DeliveryService] Delivery assigned for Order {ev.OrderId} to Driver {ev.DriverId}");
        }
    }
}
