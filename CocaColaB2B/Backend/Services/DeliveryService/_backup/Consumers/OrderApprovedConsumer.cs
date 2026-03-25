using CocaColaB2B.Shared.Events;
using DeliveryService.Data;
using MassTransit;

namespace DeliveryService.Consumers;

public class OrderApprovedConsumer : IConsumer<OrderStatusChangedEvent>
{
    private readonly DeliveryDbContext _db;

    public OrderApprovedConsumer(DeliveryDbContext db) => _db = db;

    public async Task Consume(ConsumeContext<OrderStatusChangedEvent> context)
    {
        var ev = context.Message;
        // Only create delivery assignment when order is approved and a driver is assigned
        if (ev.NewStatus == "Approved" && ev.DriverId.HasValue)
        {
            _db.DeliveryAssignments.Add(new DeliveryAssignmentEntity
            {
                OrderId = ev.OrderId,
                DriverId = ev.DriverId.Value,
                ShippingAddress = "",  // Will be populated via separate call
                Status = "Assigned"
            });
            await _db.SaveChangesAsync();
        }
    }
}
