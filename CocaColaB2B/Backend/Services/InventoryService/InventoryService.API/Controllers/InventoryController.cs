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
        return Ok(items.Select(i => new InventoryDto { Id = i.Id, ProductId = i.ProductId, ProductName = i.ProductName, ProductSKU = i.ProductSKU, QuantityInStock = i.QuantityInStock, ReorderLevel = i.ReorderLevel, LastUpdated = i.LastUpdated }));
    }

    [HttpGet("low-stock")]
    public async Task<ActionResult<List<InventoryDto>>> GetLowStock()
    {
        var items = await _db.Inventories.Where(i => i.QuantityInStock <= i.ReorderLevel).ToListAsync();
        return Ok(items.Select(i => new InventoryDto { Id = i.Id, ProductId = i.ProductId, ProductName = i.ProductName, ProductSKU = i.ProductSKU, QuantityInStock = i.QuantityInStock, ReorderLevel = i.ReorderLevel, LastUpdated = i.LastUpdated }));
    }

    [HttpPut("{productId}")]
    [Authorize(Roles = "Admin,WarehouseManager")]
    public async Task<ActionResult> UpdateStock(Guid productId, UpdateStockRequest req)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.ProductId == productId);
        if (inv == null) return NotFound();
        inv.QuantityInStock = req.QuantityInStock;
        if (req.ReorderLevel.HasValue) inv.ReorderLevel = req.ReorderLevel.Value;
        inv.LastUpdated = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        if (inv.QuantityInStock <= inv.ReorderLevel)
            await _publish.Publish(new LowStockAlertEvent { ProductId = inv.ProductId, ProductName = inv.ProductName, CurrentStock = inv.QuantityInStock, ReorderLevel = inv.ReorderLevel });
        return Ok();
    }
}
