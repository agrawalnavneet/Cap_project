using CocaColaB2B.Shared.Events;
using InventoryService.Domain.Entities;
using InventoryService.Infrastructure.Data;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Infrastructure.Consumers;

/// <summary>
/// Consumes ProductCreatedEvent from ProductService.
/// Creates a new inventory record or links an existing SKU-based record to the real ProductId.
/// </summary>
public class ProductCreatedConsumer : IConsumer<ProductCreatedEvent>
{
    private readonly InventoryDbContext _db;

    public ProductCreatedConsumer(InventoryDbContext db) => _db = db;

    public async Task Consume(ConsumeContext<ProductCreatedEvent> context)
    {
        var ev = context.Message;

        // Check if an inventory record already exists for this ProductId
        var existing = await _db.Inventories.FirstOrDefaultAsync(i => i.ProductId == ev.ProductId);
        if (existing != null)
        {
            Console.WriteLine($"[InventoryService] Inventory already exists for ProductId {ev.ProductId}");
            return;
        }

        // Check if a seeded record exists by SKU — link it to the real ProductId
        var bySku = await _db.Inventories.FirstOrDefaultAsync(i => i.ProductSKU == ev.ProductSKU);
        if (bySku != null)
        {
            bySku.ProductId = ev.ProductId;
            bySku.ProductName = ev.ProductName;
            bySku.LastUpdated = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            Console.WriteLine($"[InventoryService] Linked existing inventory (SKU {ev.ProductSKU}) to ProductId {ev.ProductId}");
            return;
        }

        // Create a new inventory record
        var inv = new InventoryEntity
        {
            ProductId = ev.ProductId,
            ProductName = ev.ProductName,
            ProductSKU = ev.ProductSKU,
            QuantityInStock = ev.InitialStock,
            ReorderLevel = ev.ReorderLevel,
            LastUpdated = DateTime.UtcNow
        };
        _db.Inventories.Add(inv);
        await _db.SaveChangesAsync();
        Console.WriteLine($"[InventoryService] Created inventory for new product {ev.ProductName} (SKU: {ev.ProductSKU}), stock: {ev.InitialStock}");
    }
}
