using CocaColaB2B.Shared.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderService.Application.UseCases.Orders;
using System.Security.Claims;

namespace OrderService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator) => _mediator = mediator;

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
        var result = await _mediator.Send(new PlaceOrderCommand(UserId, UserName, UserEmail, req));
        return Ok(result);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,WarehouseManager")]
    public async Task<ActionResult> UpdateStatus(Guid id, UpdateOrderStatusRequest req)
    {
        var result = await _mediator.Send(new UpdateOrderStatusCommand(id, req));
        if (!result) return NotFound();
        return Ok();
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var stats = await _mediator.Send(new GetDashboardStatsQuery());
        return Ok(stats);
    }
}
