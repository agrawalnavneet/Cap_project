using CocaColaB2B.Shared.DTOs;
using MediatR;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;

namespace OrderService.Application.UseCases.Carts;

public record AddToCartCommand(Guid UserId, AddToCartRequest Request) : IRequest<bool>;

public class AddToCartCommandHandler : IRequestHandler<AddToCartCommand, bool>
{
    private readonly ICartRepository _repository;

    public AddToCartCommandHandler(ICartRepository repository) => _repository = repository;

    public async Task<bool> Handle(AddToCartCommand message, CancellationToken cancellationToken)
    {
        var cart = await _repository.GetCartByUserIdAsync(message.UserId);
        if (cart == null)
        {
            cart = new CartEntity { UserId = message.UserId };
            await _repository.AddCartAsync(cart);
        }

        var req = message.Request;
        var existing = cart.Items.FirstOrDefault(i => i.ProductId == req.ProductId);
        if (existing != null)
        {
            existing.Quantity += req.Quantity;
        }
        else
        {
            cart.Items.Add(new CartItemEntity { CartId = cart.Id, ProductId = req.ProductId, ProductName = "Product", ProductPrice = 0, Quantity = req.Quantity });
        }
        
        cart.UpdatedAt = DateTime.UtcNow;
        await _repository.UpdateCartAsync(cart);
        
        return true;
    }
}

public record RemoveCartItemCommand(Guid ItemId) : IRequest<bool>;

public class RemoveCartItemCommandHandler : IRequestHandler<RemoveCartItemCommand, bool>
{
    private readonly ICartRepository _repository;

    public RemoveCartItemCommandHandler(ICartRepository repository) => _repository = repository;

    public async Task<bool> Handle(RemoveCartItemCommand message, CancellationToken cancellationToken)
    {
        var item = await _repository.GetCartItemByIdAsync(message.ItemId);
        if (item == null) return false;
        
        await _repository.RemoveCartItemAsync(item);
        return true;
    }
}

public record ClearCartCommand(Guid UserId) : IRequest<bool>;

public class ClearCartCommandHandler : IRequestHandler<ClearCartCommand, bool>
{
    private readonly ICartRepository _repository;

    public ClearCartCommandHandler(ICartRepository repository) => _repository = repository;

    public async Task<bool> Handle(ClearCartCommand message, CancellationToken cancellationToken)
    {
        var cart = await _repository.GetCartByUserIdAsync(message.UserId);
        if (cart != null)
        {
            await _repository.ClearCartItemsAsync(cart.Id);
        }
        return true;
    }
}
