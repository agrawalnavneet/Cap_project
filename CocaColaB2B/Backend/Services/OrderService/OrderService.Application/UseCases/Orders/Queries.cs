using CocaColaB2B.Shared.DTOs;
using MediatR;
using OrderService.Application.Interfaces;

namespace OrderService.Application.UseCases.Orders;

public record GetOrdersQuery(Guid UserId, string UserRole) : IRequest<List<OrderDto>>;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, List<OrderDto>>
{
    private readonly IOrderRepository _repository;

    public GetOrdersQueryHandler(IOrderRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<OrderDto>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = request.UserRole == "Wholesaler" ? await _repository.GetOrdersByWholesalerAsync(request.UserId) :
                     request.UserRole == "Driver" ? await _repository.GetOrdersByDriverAsync(request.UserId) :
                     await _repository.GetAllOrdersAsync();

        return orders.OrderByDescending(o => o.OrderDate).Select(o => new OrderDto
        {
            Id = o.Id, WholesalerId = o.WholesalerId, WholesalerName = o.WholesalerName,
            DriverId = o.DriverId, OrderDate = o.OrderDate, TotalAmount = o.TotalAmount,
            Status = o.Status, ShippingAddress = o.ShippingAddress,
            PaymentId = o.PaymentId, PaymentStatus = o.PaymentStatus,
            Items = o.Items.Select(i => new OrderItemDto { Id = i.Id, ProductId = i.ProductId, ProductName = i.ProductName, Quantity = i.Quantity, UnitPrice = i.UnitPrice, TotalPrice = i.Quantity * i.UnitPrice }).ToList()
        }).ToList();
    }
}

public record GetDashboardStatsQuery() : IRequest<DashboardStatsDto>;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IOrderRepository _repository;

    public GetDashboardStatsQueryHandler(IOrderRepository repository)
    {
        _repository = repository;
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var orders = await _repository.GetAllOrdersAsync();
        return new DashboardStatsDto
        {
            TotalOrders = orders.Count,
            PendingOrders = orders.Count(o => o.Status == "Pending"),
            TotalRevenue = orders.Where(o => o.Status == "Delivered").Sum(o => o.TotalAmount),
            // TotalProducts and TotalUsers are populated by the frontend from their respective services
            TotalProducts = 0,
            TotalUsers = 0,
            RecentOrders = orders.OrderByDescending(o => o.OrderDate).Take(10).Select(o => new RecentOrderDto { Id = o.Id, WholesalerName = o.WholesalerName, TotalAmount = o.TotalAmount, Status = o.Status, OrderDate = o.OrderDate }).ToList()
        };
    }
}
