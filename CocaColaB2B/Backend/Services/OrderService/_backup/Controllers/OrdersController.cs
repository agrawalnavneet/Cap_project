using CocaColaB2B.Shared.DTOs;
using CocaColaB2B.Shared.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using System.Security.Claims;

namespace OrderService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly IPublishEndpoint _publish;

    public OrdersController(OrderDbContext db, IPublishEndpoint publish) { _db = db; _publish = publish; }

    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string UserRole => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders()
    {
        var query = _db.Orders.Include(o => o.Items).AsQueryable();
        if (UserRole == "Wholesaler") query = query.Where(o => o.WholesalerId == UserId);
        if (UserRole == "Driver") query = query.Where(o => o.DriverId == UserId);

        var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
        return Ok(orders.Select(o => new OrderDto
        {
            Id = o.Id, WholesalerId = o.WholesalerId, WholesalerName = o.WholesalerName,
            DriverId = o.DriverId, OrderDate = o.OrderDate, TotalAmount = o.TotalAmount,
            Status = o.Status, ShippingAddress = o.ShippingAddress,
            Items = o.Items.Select(i => new OrderItemDto { Id = i.Id, ProductId = i.ProductId, ProductName = i.ProductName, Quantity = i.Quantity, UnitPrice = i.UnitPrice, TotalPrice = i.Quantity * i.UnitPrice }).ToList()
        }));
    }

    [HttpPost]
    [Authorize(Roles = "Wholesaler")]
    public async Task<ActionResult<OrderDto>> PlaceOrder(PlaceOrderRequest req)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "";
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "";

        var order = new OrderEntity { WholesalerId = UserId, WholesalerName = userName, WholesalerEmail = userEmail, ShippingAddress = req.ShippingAddress };
        decimal total = 0;
        var eventItems = new List<OrderItemEvent>();

        foreach (var item in req.Items)
        {
            var oi = new OrderItemEntity { OrderId = order.Id, ProductId = item.ProductId, ProductName = $"Product-{item.ProductId.ToString()[..8]}", Quantity = item.Quantity, UnitPrice = 0 };
            total += oi.Quantity * oi.UnitPrice;
            order.Items.Add(oi);
            eventItems.Add(new OrderItemEvent { ProductId = item.ProductId, Quantity = item.Quantity, UnitPrice = oi.UnitPrice });
        }
        order.TotalAmount = total;

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        // Publish event for other services
        await _publish.Publish(new OrderPlacedEvent
        {
            OrderId = order.Id, WholesalerId = UserId, WholesalerEmail = userEmail,
            WholesalerName = userName, TotalAmount = total, ShippingAddress = req.ShippingAddress,
            Items = eventItems, OrderDate = order.OrderDate
        });

        return Ok(new OrderDto { Id = order.Id, TotalAmount = total, Status = "Pending", OrderDate = order.OrderDate, ShippingAddress = order.ShippingAddress });
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,WarehouseManager")]
    public async Task<ActionResult> UpdateStatus(Guid id, UpdateOrderStatusRequest req)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();

        order.Status = req.Status;
        if (req.DriverId.HasValue) order.DriverId = req.DriverId;
        await _db.SaveChangesAsync();

        await _publish.Publish(new OrderStatusChangedEvent
        {
            OrderId = order.Id, WholesalerId = order.WholesalerId,
            WholesalerEmail = order.WholesalerEmail, NewStatus = req.Status,
            DriverId = req.DriverId, ChangedAt = DateTime.UtcNow
        });

        return Ok();
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var orders = await _db.Orders.ToListAsync();
        return Ok(new DashboardStatsDto
        {
            TotalOrders = orders.Count,
            PendingOrders = orders.Count(o => o.Status == "Pending"),
            TotalRevenue = orders.Where(o => o.Status == "Delivered").Sum(o => o.TotalAmount),
            RecentOrders = orders.OrderByDescending(o => o.OrderDate).Take(10).Select(o => new RecentOrderDto { Id = o.Id, WholesalerName = o.WholesalerName, TotalAmount = o.TotalAmount, Status = o.Status, OrderDate = o.OrderDate }).ToList()
        });
    }
}
