using CocaColaB2B.Shared.DTOs;
using MediatR;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;

namespace OrderService.Application.UseCases.Carts;

// ──── Add To Cart ────
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
            // Set quantity to requested value (not +=, to avoid doubling)
            existing.Quantity = req.Quantity;
            // Update product name and price if provided
            if (!string.IsNullOrEmpty(req.ProductName)) existing.ProductName = req.ProductName;
            if (req.ProductPrice > 0) existing.ProductPrice = req.ProductPrice;
        }
        else
        {
            cart.Items.Add(new CartItemEntity
            {
                CartId = cart.Id,
                ProductId = req.ProductId,
                ProductName = !string.IsNullOrEmpty(req.ProductName) ? req.ProductName : "Product",
                ProductPrice = req.ProductPrice,
                Quantity = req.Quantity
            });
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _repository.UpdateCartAsync(cart);

        return true;
    }
}

// ──── Update Cart Item Quantity ────
public record UpdateCartItemCommand(Guid ItemId, int Quantity) : IRequest<bool>;

public class UpdateCartItemCommandHandler : IRequestHandler<UpdateCartItemCommand, bool>
{
    private readonly ICartRepository _repository;

    public UpdateCartItemCommandHandler(ICartRepository repository) => _repository = repository;

    public async Task<bool> Handle(UpdateCartItemCommand message, CancellationToken cancellationToken)
    {
        var item = await _repository.GetCartItemByIdAsync(message.ItemId);
        if (item == null) return false;

        if (message.Quantity <= 0)
        {
            // If quantity is 0 or less, remove the item
            await _repository.RemoveCartItemAsync(item);
        }
        else
        {
            item.Quantity = message.Quantity;
            await _repository.UpdateCartItemAsync(item);
        }

        return true;
    }
}

// ──── Remove Cart Item ────
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

// ──── Clear Cart ────
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
