using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;

namespace OrderService.Infrastructure.Repositories;

public class CartRepository : ICartRepository
{
    private readonly OrderDbContext _context;

    public CartRepository(OrderDbContext context)
    {
        _context = context;
    }

    public async Task<CartEntity?> GetCartByUserIdAsync(Guid userId)
    {
        return await _context.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId);
    }

    public async Task AddCartAsync(CartEntity cart)
    {
        await _context.Carts.AddAsync(cart);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// BUG-2 FIX: The old implementation tried to Attach an already-tracked entity,
    /// which caused EF Core concurrency conflicts (DbUpdateConcurrencyException).
    ///
    /// Root cause: When GetCartByUserIdAsync loads the cart, EF Core starts tracking it.
    /// When the handler adds a new CartItemEntity to cart.Items, the cart entity is already
    /// in "Unchanged" state. The old code called Attach() which conflicts with existing tracking.
    ///
    /// Fix: Simply mark the cart as Modified (if tracked) and ensure new items are detected
    /// by the change tracker. No need to Attach — EF Core already tracks the entity.
    /// </summary>
    public async Task UpdateCartAsync(CartEntity cart)
    {
        // The cart was loaded via GetCartByUserIdAsync, so it's already tracked.
        // Just update the timestamp and let EF Core detect new/modified items automatically.
        cart.UpdatedAt = DateTime.UtcNow;

        var entry = _context.Entry(cart);
        if (entry.State == EntityState.Detached)
        {
            // Edge case: if somehow detached, re-attach + mark modified
            _context.Carts.Update(cart);
        }
        else
        {
            // Already tracked — just mark modified so EF Core processes the update
            entry.State = EntityState.Modified;
        }

        // Ensure any new CartItemEntity objects added to cart.Items are detected as "Added"
        foreach (var item in cart.Items)
        {
            var itemEntry = _context.Entry(item);
            if (itemEntry.State == EntityState.Detached)
            {
                // New item not yet tracked — mark it as Added
                _context.CartItems.Add(item);
            }
        }

        await _context.SaveChangesAsync();
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
