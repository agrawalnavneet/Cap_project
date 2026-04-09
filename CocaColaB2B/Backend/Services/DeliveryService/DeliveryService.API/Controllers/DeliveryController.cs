using CocaColaB2B.Shared.DTOs;
using CocaColaB2B.Shared.Events;
using DeliveryService.Infrastructure.Data;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DeliveryService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Driver")]
public class DeliveryController : ControllerBase
{
    private readonly DeliveryDbContext _db;
    private readonly IPublishEndpoint _publish;

    public DeliveryController(DeliveryDbContext db, IPublishEndpoint publish) { _db = db; _publish = publish; }

    private Guid? TryGetUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<ActionResult<List<DeliveryDto>>> GetDeliveries()
    {
        var userId = TryGetUserId();
        if (userId is null) return Unauthorized();
        var deliveries = await _db.DeliveryAssignments.Where(d => d.DriverId == userId).OrderByDescending(d => d.AssignedAt).ToListAsync();
        return Ok(deliveries.Select(d => new DeliveryDto { Id = d.Id, OrderId = d.OrderId, WholesalerName = d.WholesalerName, ShippingAddress = d.ShippingAddress, OrderTotal = d.OrderTotal, Status = d.Status, AssignedAt = d.AssignedAt, DeliveredAt = d.DeliveredAt, Notes = d.Notes }));
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateStatus(Guid id, UpdateDeliveryStatusRequest req)
    {
        var userId = TryGetUserId();
        if (userId is null) return Unauthorized();
        var delivery = await _db.DeliveryAssignments.FindAsync(id);
        if (delivery == null) return NotFound();
        if (delivery.DriverId != userId) return Forbid();

        delivery.Status = req.Status;
        delivery.Notes = req.Notes;
        if (req.Status == "Delivered") delivery.DeliveredAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _publish.Publish(new OrderStatusChangedEvent { OrderId = delivery.OrderId, NewStatus = req.Status == "Delivered" ? "Delivered" : "OutForDelivery", ChangedAt = DateTime.UtcNow });
        return Ok();
    }
}
