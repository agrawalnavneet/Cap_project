using CocaColaB2B.Shared.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.UseCases.Carts;
using System.Security.Claims;

namespace OrderService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Wholesaler")]
public class CartController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<CartController> _logger;

    public CartController(IMediator mediator, ILogger<CartController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    private Guid? TryGetUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        var userId = TryGetUserId();
        if (userId is null) return Unauthorized(new { error = "Invalid or missing user token." });

        var cart = await _mediator.Send(new GetCartQuery(userId.Value));
        return Ok(cart);
    }

    [HttpPost]
    public async Task<ActionResult> AddToCart([FromBody] AddToCartRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid cart payload." });
        var userId = TryGetUserId();
        if (userId is null)
        {
            _logger.LogWarning("Unauthorized add-to-cart attempt — missing or invalid token");
            return Unauthorized(new { error = "Invalid or missing user token." });
        }

        try
        {
            _logger.LogInformation("AddToCart request: user {UserId}, product {ProductId}, qty {Qty}",
                userId, req.ProductId, req.Quantity);
            await _mediator.Send(new AddToCartCommand(userId.Value, req));
            return Ok(new { message = "Item added to cart successfully." });
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Cart concurrency conflict for user {UserId} after all retries exhausted", userId);
            return Conflict(new { error = "Your cart was updated by another request. Please refresh and try again.", retryable = false });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "Cart database conflict for user {UserId}", userId);
            return Conflict(new { error = "A temporary conflict occurred. Please try again.", retryable = true });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid add-to-cart request for user {UserId}", userId);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected cart error for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to add item to cart." });
        }
    }

    [HttpPut("{itemId}")]
    public async Task<ActionResult> UpdateItem(Guid itemId, UpdateCartItemRequest req)
    {
        try
        {
            var success = await _mediator.Send(new UpdateCartItemCommand(itemId, req.Quantity));
            if (!success) return NotFound();
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
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
        var userId = TryGetUserId();
        if (userId is null) return Unauthorized(new { error = "Invalid or missing user token." });
        await _mediator.Send(new ClearCartCommand(userId.Value));
        return NoContent();
    }
}
