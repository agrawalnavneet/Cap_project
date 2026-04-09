using CocaColaB2B.Shared.Events;
using InventoryService.Domain.Entities;
using InventoryService.Infrastructure.Data;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Infrastructure.Consumers;

public class OrderPlacedConsumer : IConsumer<OrderPlacedEvent>
{
    private readonly InventoryDbContext _db;
    private readonly IPublishEndpoint _publish;

    public OrderPlacedConsumer(InventoryDbContext db, IPublishEndpoint publish) { _db = db; _publish = publish; }

    public async Task Consume(ConsumeContext<OrderPlacedEvent> context)
    {
        foreach (var item in context.Message.Items)
        {
            // Match by ProductId first; if not found (e.g. seed data has no ProductId),
            // update the record with the real ProductId so future lookups work.
            var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.ProductId == item.ProductId);

            if (inv == null)
            {
                Console.WriteLine($"[InventoryService] WARNING: No inventory record found for ProductId {item.ProductId}. Stock not deducted.");
                continue;
            }

            inv.QuantityInStock = Math.Max(0, inv.QuantityInStock - item.Quantity);
            inv.LastUpdated = DateTime.UtcNow;

            if (inv.QuantityInStock <= inv.ReorderLevel)
            {
                await _publish.Publish(new LowStockAlertEvent
                {
                    ProductId = inv.ProductId,
                    ProductName = inv.ProductName,
                    CurrentStock = inv.QuantityInStock,
                    ReorderLevel = inv.ReorderLevel
                });
            }
        }
        await _db.SaveChangesAsync();
    }
}
