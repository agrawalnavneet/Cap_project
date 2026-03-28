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

    public async Task UpdateCartAsync(CartEntity cart)
    {
        _context.Carts.Update(cart);
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
        _context.CartItems.Update(item);
        await _context.SaveChangesAsync();
    }

    public async Task ClearCartItemsAsync(Guid cartId)
    {
        var items = await _context.CartItems.Where(i => i.CartId == cartId).ToListAsync();
        _context.CartItems.RemoveRange(items);
        await _context.SaveChangesAsync();
    }
}
