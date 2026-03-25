using OrderService.Domain.Entities;

namespace OrderService.Application.Interfaces;

public interface IOrderRepository
{
    Task<OrderEntity?> GetOrderByIdAsync(Guid id);
    Task<List<OrderEntity>> GetOrdersByWholesalerAsync(Guid wholesalerId);
    Task<List<OrderEntity>> GetOrdersByDriverAsync(Guid driverId);
    Task<List<OrderEntity>> GetAllOrdersAsync();
    Task AddOrderAsync(OrderEntity order);
    Task UpdateOrderAsync(OrderEntity order);
}

public interface ICartRepository
{
    Task<CartEntity?> GetCartByUserIdAsync(Guid userId);
    Task AddCartAsync(CartEntity cart);
    Task UpdateCartAsync(CartEntity cart);
    Task<CartItemEntity?> GetCartItemByIdAsync(Guid itemId);
    Task RemoveCartItemAsync(CartItemEntity item);
    Task ClearCartItemsAsync(Guid cartId);
}
