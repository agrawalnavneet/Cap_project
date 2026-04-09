using CocaColaB2B.Shared.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;

namespace OrderService.Application.UseCases.Carts;

// ──── Add To Cart ────
public record AddToCartCommand(Guid UserId, AddToCartRequest Request) : IRequest<bool>;

public class AddToCartCommandHandler : IRequestHandler<AddToCartCommand, bool>
{
    private readonly ICartRepository _repository;
    private readonly IProductCatalogService _productCatalogService;
    private readonly ILogger<AddToCartCommandHandler> _logger;

    public AddToCartCommandHandler(
        ICartRepository repository,
        IProductCatalogService productCatalogService,
        ILogger<AddToCartCommandHandler> logger)
    {
        _repository = repository;
        _productCatalogService = productCatalogService;
        _logger = logger;
    }

    /// <summary>
    /// Handles add-to-cart with retry logic for concurrency and race conditions.
    /// - DbUpdateConcurrencyException: another request modified the same cart row
    /// - DbUpdateException: race condition on cart creation (duplicate unique key)
    /// On each retry, we clear the EF Core change tracker and re-fetch the latest state.
    /// </summary>
    public async Task<bool> Handle(AddToCartCommand message, CancellationToken cancellationToken)
    {
        const int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                return await AddToCartCore(message, cancellationToken);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex,
                    "Cart concurrency conflict for user {UserId}, product {ProductId} (attempt {Attempt}/{Max})",
                    message.UserId, message.Request.ProductId, attempt + 1, maxRetries);

                if (attempt == maxRetries - 1)
                    throw; // Exhausted retries — let controller handle as 409

                await Task.Delay(150 * (attempt + 1), cancellationToken);
                _repository.ClearTracking();
            }
            catch (DbUpdateException ex) when (attempt < maxRetries - 1)
            {
                // Race condition: two concurrent requests both tried to create a new cart
                // for the same user, or insert duplicate cart items.
                _logger.LogWarning(ex,
                    "Cart DB conflict for user {UserId} (attempt {Attempt}/{Max}) — retrying with fresh state",
                    message.UserId, attempt + 1, maxRetries);

                await Task.Delay(150 * (attempt + 1), cancellationToken);
                _repository.ClearTracking();
            }
        }
        return false; // Should never reach here
    }

    private async Task<bool> AddToCartCore(AddToCartCommand message, CancellationToken cancellationToken)
    {
        var req = message.Request;
        if (req.ProductId == Guid.Empty)
            throw new InvalidOperationException("Invalid product.");

        // ── Backend quantity validation: minimum 10 ───────────────────────────
        if (req.Quantity < 10)
            throw new InvalidOperationException("Minimum order quantity is 10 units per product.");

        // Validate product against ProductService and use trusted values from backend.
        var product = await _productCatalogService.GetProductAsync(req.ProductId, cancellationToken);
        if (product is null)
            throw new InvalidOperationException("Product not found or unavailable.");

        var cart = await _repository.GetCartByUserIdAsync(message.UserId);
        if (cart == null)
        {
            cart = new CartEntity
            {
                UserId = message.UserId,
                UpdatedAt = DateTime.UtcNow
            };
            cart.Items.Add(new CartItemEntity
            {
                CartId = cart.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                ProductPrice = product.Price,
                Quantity = req.Quantity
            });
            await _repository.AddCartAsync(cart);
            _logger.LogInformation(
                "Created new cart for user {UserId} with product {ProductName} x{Qty}",
                message.UserId, product.Name, req.Quantity);
            return true;
        }

        var existing = cart.Items.FirstOrDefault(i => i.ProductId == req.ProductId);
        if (existing != null)
        {
            existing.Quantity += req.Quantity;
            existing.ProductName = product.Name;
            existing.ProductPrice = product.Price;
            _logger.LogInformation(
                "Updated cart item for user {UserId}: {ProductName} quantity now {Qty}",
                message.UserId, product.Name, existing.Quantity);
        }
        else
        {
            cart.Items.Add(new CartItemEntity
            {
                CartId = cart.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                ProductPrice = product.Price,
                Quantity = req.Quantity
            });
            _logger.LogInformation(
                "Added new item to cart for user {UserId}: {ProductName} x{Qty}",
                message.UserId, product.Name, req.Quantity);
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
            await _repository.RemoveCartItemAsync(item);
        }
        else if (message.Quantity < 10)
        {
            throw new InvalidOperationException("Minimum order quantity is 10 units per product.");
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
