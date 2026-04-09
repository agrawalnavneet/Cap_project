using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;

namespace OrderService.Infrastructure.Repositories;

public class CartRepository : ICartRepository
{
    private readonly OrderDbContext _context;
    private readonly ILogger<CartRepository> _logger;

    public CartRepository(OrderDbContext context, ILogger<CartRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CartEntity?> GetCartByUserIdAsync(Guid userId)
    {
        return await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);
    }

    public async Task AddCartAsync(CartEntity cart)
    {
        await _context.Carts.AddAsync(cart);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Created new cart {CartId} for user {UserId}", cart.Id, cart.UserId);
    }

    /// <summary>
    /// FIXED: Removed forced EntityState.Modified which caused DbUpdateConcurrencyException.
    /// EF Core's change tracker automatically detects dirty properties on tracked entities.
    /// Forcing EntityState.Modified caused ALL properties to be included in the UPDATE WHERE
    /// clause (with original values), which fails when another request modified the same row.
    ///
    /// Fix: Let EF Core's automatic dirty-tracking handle modifications. Only explicitly
    /// add new CartItemEntity objects that aren't yet tracked.
    /// </summary>
    public async Task UpdateCartAsync(CartEntity cart)
    {
        cart.UpdatedAt = DateTime.UtcNow;

        // DO NOT force EntityState.Modified — let EF Core detect changes naturally.
        // The cart is already tracked from GetCartByUserIdAsync, so any property
        // changes (UpdatedAt, item quantity) are automatically detected.

        var entry = _context.Entry(cart);
        if (entry.State == EntityState.Detached)
        {
            // Edge case: entity was detached (e.g. after ClearTracking) — re-attach
            _context.Carts.Update(cart);
        }
        // else: already tracked (Unchanged/Modified) — EF Core handles it

        // Ensure any new CartItemEntity objects added to cart.Items are tracked as Added
        foreach (var item in cart.Items)
        {
            var itemEntry = _context.Entry(item);
            if (itemEntry.State == EntityState.Detached)
            {
                _context.CartItems.Add(item);
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Updated cart {CartId} — {ItemCount} items", cart.Id, cart.Items.Count);
    }

    public async Task<CartItemEntity?> GetCartItemByIdAsync(Guid itemId)
    {
        return await _context.CartItems.FindAsync(itemId);
    }

    public async Task RemoveCartItemAsync(CartItemEntity item)
    {
        _context.CartItems.Remove(item);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateCartItemAsync(CartItemEntity item)
    {
        var entry = _context.Entry(item);
        if (entry.State == EntityState.Detached)
        {
            _context.CartItems.Attach(item);
            entry.State = EntityState.Modified;
        }

        await _context.SaveChangesAsync();
    }

    public async Task ClearCartItemsAsync(Guid cartId)
    {
        var items = await _context.CartItems.Where(i => i.CartId == cartId).ToListAsync();
        _context.CartItems.RemoveRange(items);
        await _context.SaveChangesAsync();
    }

    public void ClearTracking()
    {
        _context.ChangeTracker.Clear();
    }
}
