using CocaColaB2B.Shared.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderService.Application.UseCases.Carts;
using System.Security.Claims;

namespace OrderService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Wholesaler")]
public class CartController : ControllerBase
{
    private readonly IMediator _mediator;

    public CartController(IMediator mediator) => _mediator = mediator;

    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        var cart = await _mediator.Send(new GetCartQuery(UserId));
        return Ok(cart);
    }

    [HttpPost]
    public async Task<ActionResult> AddToCart(AddToCartRequest req)
    {
        await _mediator.Send(new AddToCartCommand(UserId, req));
        return Ok();
    }

    [HttpDelete("{itemId}")]
    public async Task<ActionResult> RemoveItem(Guid itemId)
    {
        var success = await _mediator.Send(new RemoveCartItemCommand(itemId));
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult> ClearCart()
    {
        await _mediator.Send(new ClearCartCommand(UserId));
        return NoContent();
    }
}
