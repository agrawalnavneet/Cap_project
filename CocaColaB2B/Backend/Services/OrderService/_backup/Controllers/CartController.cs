using CocaColaB2B.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using System.Security.Claims;

namespace OrderService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Wholesaler")]
public class CartController : ControllerBase
{
    private readonly OrderDbContext _db;
    public CartController(OrderDbContext db) => _db = db;

    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        var cart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == UserId);
        if (cart == null) return Ok(new CartDto { Items = new(), TotalAmount = 0, TotalItems = 0 });

        return Ok(new CartDto
        {
            Id = cart.Id,
            Items = cart.Items.Select(ci => new CartItemDto { Id = ci.Id, ProductId = ci.ProductId, ProductName = ci.ProductName, ProductPrice = ci.ProductPrice, Quantity = ci.Quantity, SubTotal = ci.Quantity * ci.ProductPrice }).ToList(),
            TotalAmount = cart.Items.Sum(ci => ci.Quantity * ci.ProductPrice),
            TotalItems = cart.Items.Sum(ci => ci.Quantity)
        });
    }

    [HttpPost]
    public async Task<ActionResult> AddToCart(AddToCartRequest req)
    {
        var cart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == UserId);
        if (cart == null) { cart = new CartEntity { UserId = UserId }; _db.Carts.Add(cart); await _db.SaveChangesAsync(); }

        var existing = cart.Items.FirstOrDefault(i => i.ProductId == req.ProductId);
        if (existing != null) { existing.Quantity += req.Quantity; }
        else { cart.Items.Add(new CartItemEntity { CartId = cart.Id, ProductId = req.ProductId, ProductName = "Product", ProductPrice = 0, Quantity = req.Quantity }); }
        cart.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{itemId}")]
    public async Task<ActionResult> RemoveItem(Guid itemId)
    {
        var item = await _db.CartItems.FindAsync(itemId);
        if (item == null) return NotFound();
        _db.CartItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult> ClearCart()
    {
        var cart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == UserId);
        if (cart != null) { _db.CartItems.RemoveRange(cart.Items); await _db.SaveChangesAsync(); }
        return NoContent();
    }
}
