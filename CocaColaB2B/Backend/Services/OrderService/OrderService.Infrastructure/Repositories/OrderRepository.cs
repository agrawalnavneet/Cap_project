using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;

namespace OrderService.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly OrderDbContext _context;

    public OrderRepository(OrderDbContext context)
    {
        _context = context;
    }

    public async Task<OrderEntity?> GetOrderByIdAsync(Guid id)
    {
        return await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<List<OrderEntity>> GetOrdersByWholesalerAsync(Guid wholesalerId)
    {
        return await _context.Orders.Include(o => o.Items).Where(o => o.WholesalerId == wholesalerId).ToListAsync();
    }

    public async Task<List<OrderEntity>> GetOrdersByDriverAsync(Guid driverId)
    {
        return await _context.Orders.Include(o => o.Items).Where(o => o.DriverId == driverId).ToListAsync();
    }

    public async Task<List<OrderEntity>> GetAllOrdersAsync()
    {
        return await _context.Orders.Include(o => o.Items).ToListAsync();
    }

    public async Task AddOrderAsync(OrderEntity order)
    {
        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateOrderAsync(OrderEntity order)
    {
        _context.Orders.Update(order);
        await _context.SaveChangesAsync();
    }
}
