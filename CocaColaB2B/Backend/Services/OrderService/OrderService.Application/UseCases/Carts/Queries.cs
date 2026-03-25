using CocaColaB2B.Shared.DTOs;
using MediatR;
using OrderService.Application.Interfaces;

namespace OrderService.Application.UseCases.Carts;

public record GetCartQuery(Guid UserId) : IRequest<CartDto>;

public class GetCartQueryHandler : IRequestHandler<GetCartQuery, CartDto>
{
    private readonly ICartRepository _repository;

    public GetCartQueryHandler(ICartRepository repository)
    {
        _repository = repository;
    }

    public async Task<CartDto> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        var cart = await _repository.GetCartByUserIdAsync(request.UserId);
        if (cart == null) return new CartDto { Items = new(), TotalAmount = 0, TotalItems = 0 };

        return new CartDto
        {
            Id = cart.Id,
            Items = cart.Items.Select(ci => new CartItemDto { Id = ci.Id, ProductId = ci.ProductId, ProductName = ci.ProductName, ProductPrice = ci.ProductPrice, Quantity = ci.Quantity, SubTotal = ci.Quantity * ci.ProductPrice }).ToList(),
            TotalAmount = cart.Items.Sum(ci => ci.Quantity * ci.ProductPrice),
            TotalItems = cart.Items.Sum(ci => ci.Quantity)
        };
    }
}
