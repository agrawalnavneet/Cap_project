using CocaColaB2B.Shared.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderService.Application.Interfaces;
using OrderService.Application.UseCases.Orders;
using System.Security.Claims;

namespace OrderService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IOrderHubNotifier _hubNotifier;

    public OrdersController(IMediator mediator, IOrderHubNotifier hubNotifier)
    {
        _mediator = mediator;
        _hubNotifier = hubNotifier;
    }

    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string UserRole => User.FindFirst(ClaimTypes.Role)?.Value ?? "";
    private string UserName => User.FindFirst(ClaimTypes.Name)?.Value ?? "";
    private string UserEmail => User.FindFirst(ClaimTypes.Email)?.Value ?? "";

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders()
    {
        var orders = await _mediator.Send(new GetOrdersQuery(UserId, UserRole));
        return Ok(orders);
    }

    [HttpPost]
    [Authorize(Roles = "Wholesaler")]
    public async Task<ActionResult<OrderDto>> PlaceOrder(PlaceOrderRequest req)
    {
        try
        {
            var result = await _mediator.Send(new PlaceOrderCommand(UserId, UserName, UserEmail, req));

            // Broadcast new order to Admin and WarehouseManager via SignalR
            try
            {
                await _hubNotifier.NotifyNewOrderReceived(
                    result.Id.ToString(), UserName, result.TotalAmount, result.OrderDate);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARN] SignalR notification failed: {ex.Message}");
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            // Cart empty, or other business rule violation
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] PlaceOrder failed: {ex}");
            return StatusCode(500, new { error = "Failed to place order. Please try again." });
        }
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,WarehouseManager")]
    public async Task<ActionResult> UpdateStatus(Guid id, UpdateOrderStatusRequest req)
    {
        var result = await _mediator.Send(new UpdateOrderStatusCommand(id, req));
        if (!result) return NotFound();

        // OrderStatusChanged is already broadcast by the command handler via IOrderHubNotifier.
        // No duplicate broadcast here.

        // If a driver was assigned, notify the driver with full order details
        if (req.DriverId.HasValue)
        {
            // Fetch the order to get real data for the delivery alert
            var order = await _mediator.Send(new GetOrdersQuery(Guid.Empty, "Admin"));
            var orderData = order.FirstOrDefault(o => o.Id == id);

            await _hubNotifier.NotifyDeliveryAssigned(
                req.DriverId.Value,
                id.ToString(),
                orderData?.WholesalerName ?? "",
                orderData?.ShippingAddress ?? "",
                orderData?.TotalAmount ?? 0
            );
        }

        return Ok();
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Admin,Wholesaler,WarehouseManager")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var stats = await _mediator.Send(new GetDashboardStatsQuery());
        return Ok(stats);
    }
}
