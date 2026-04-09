using CocaColaB2B.Shared.DTOs;
using CocaColaB2B.Shared.Events;
using InventoryService.Domain.Entities;
using InventoryService.Infrastructure.Data;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly InventoryDbContext _db;
    private readonly IPublishEndpoint _publish;

    public InventoryController(InventoryDbContext db, IPublishEndpoint publish) { _db = db; _publish = publish; }

    [HttpGet]
    public async Task<ActionResult<List<InventoryDto>>> GetAll()
    {
        var items = await _db.Inventories.OrderBy(i => i.ProductName).ToListAsync();
        return Ok(items.Select(ToDto));
    }

    [HttpGet("low-stock")]
    public async Task<ActionResult<List<InventoryDto>>> GetLowStock()
    {
        var items = await _db.Inventories.Where(i => i.QuantityInStock <= i.ReorderLevel).ToListAsync();
        return Ok(items.Select(ToDto));
    }

    /// <summary>
    /// Update stock by ProductId (Guid). Also accepts SKU as a string Guid for backward compat.
    /// </summary>
    [HttpPut("{productId}")]
    [Authorize(Roles = "Admin,WarehouseManager")]
    public async Task<ActionResult> UpdateStock(string productId, UpdateStockRequest req)
    {
        InventoryEntity? inv = null;

        // Try matching by ProductId (Guid) first
        if (Guid.TryParse(productId, out var guid) && guid != Guid.Empty)
            inv = await _db.Inventories.FirstOrDefaultAsync(i => i.ProductId == guid);

        // Fall back to matching by SKU (for seeded data that has no ProductId yet)
        if (inv == null)
            inv = await _db.Inventories.FirstOrDefaultAsync(i => i.ProductSKU == productId);

        if (inv == null) return NotFound();

        // If we found by SKU and the ProductId is empty, store the real ProductId
        if (inv.ProductId == Guid.Empty && guid != Guid.Empty)
            inv.ProductId = guid;

        inv.QuantityInStock = req.QuantityInStock;
        if (req.ReorderLevel.HasValue) inv.ReorderLevel = req.ReorderLevel.Value;
        inv.LastUpdated = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (inv.QuantityInStock <= inv.ReorderLevel)
            await _publish.Publish(new LowStockAlertEvent
            {
                ProductId = inv.ProductId,
                ProductName = inv.ProductName,
                CurrentStock = inv.QuantityInStock,
                ReorderLevel = inv.ReorderLevel
            });

        return Ok();
    }

    /// <summary>
    /// Link an inventory record to a product by SKU → ProductId.
    /// Called when products are created so inventory can be matched by ProductId.
    /// </summary>
    [HttpPost("link")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> LinkProductId([FromBody] LinkInventoryRequest req)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.ProductSKU == req.ProductSKU);
        if (inv == null) return NotFound(new { error = $"No inventory record for SKU {req.ProductSKU}" });
        inv.ProductId = req.ProductId;
        await _db.SaveChangesAsync();
        return Ok();
    }

    private static InventoryDto ToDto(InventoryEntity i) => new()
    {
        Id = i.Id, ProductId = i.ProductId, ProductName = i.ProductName,
        ProductSKU = i.ProductSKU, QuantityInStock = i.QuantityInStock,
        ReorderLevel = i.ReorderLevel, LastUpdated = i.LastUpdated
    };
}

public class LinkInventoryRequest
{
    public string ProductSKU { get; set; } = "";
    public Guid ProductId { get; set; }
}
