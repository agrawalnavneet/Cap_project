using CocaColaB2B.Shared.DTOs;
using CocaColaB2B.Shared.Events;
using MassTransit;
using MediatR;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;

namespace OrderService.Application.UseCases.Orders;

public record PlaceOrderCommand(Guid UserId, string UserName, string UserEmail, PlaceOrderRequest Request) : IRequest<OrderDto>;

public class PlaceOrderCommandHandler : IRequestHandler<PlaceOrderCommand, OrderDto>
{
    private readonly IOrderRepository _repository;
    private readonly IPublishEndpoint _publish;

    public PlaceOrderCommandHandler(IOrderRepository repository, IPublishEndpoint publish)
    {
        _repository = repository;
        _publish = publish;
    }

    public async Task<OrderDto> Handle(PlaceOrderCommand message, CancellationToken cancellationToken)
    {
        var req = message.Request;
        var order = new OrderEntity { WholesalerId = message.UserId, WholesalerName = message.UserName, WholesalerEmail = message.UserEmail, ShippingAddress = req.ShippingAddress };
        decimal total = 0;
        var eventItems = new List<OrderItemEvent>();

        foreach (var item in req.Items)
        {
            var oi = new OrderItemEntity { OrderId = order.Id, ProductId = item.ProductId, ProductName = $"Product-{item.ProductId.ToString()[..8]}", Quantity = item.Quantity, UnitPrice = 0 };
            total += oi.Quantity * oi.UnitPrice;
            order.Items.Add(oi);
            eventItems.Add(new OrderItemEvent { ProductId = item.ProductId, Quantity = item.Quantity, UnitPrice = oi.UnitPrice });
        }
        order.TotalAmount = total;

        await _repository.AddOrderAsync(order);

        await _publish.Publish(new OrderPlacedEvent
        {
            OrderId = order.Id, WholesalerId = message.UserId, WholesalerEmail = message.UserEmail,
            WholesalerName = message.UserName, TotalAmount = total, ShippingAddress = req.ShippingAddress,
            Items = eventItems, OrderDate = order.OrderDate
        });

        return new OrderDto { Id = order.Id, TotalAmount = total, Status = "Pending", OrderDate = order.OrderDate, ShippingAddress = order.ShippingAddress };
    }
}

public record UpdateOrderStatusCommand(Guid Id, UpdateOrderStatusRequest Request) : IRequest<bool>;

public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, bool>
{
    private readonly IOrderRepository _repository;
    private readonly IPublishEndpoint _publish;

    public UpdateOrderStatusCommandHandler(IOrderRepository repository, IPublishEndpoint publish)
    {
        _repository = repository;
        _publish = publish;
    }

    public async Task<bool> Handle(UpdateOrderStatusCommand message, CancellationToken cancellationToken)
    {
        var order = await _repository.GetOrderByIdAsync(message.Id);
        if (order == null) return false;

        order.Status = message.Request.Status;
        if (message.Request.DriverId.HasValue) order.DriverId = message.Request.DriverId;
        await _repository.UpdateOrderAsync(order);

        await _publish.Publish(new OrderStatusChangedEvent
        {
            OrderId = order.Id, WholesalerId = order.WholesalerId,
            WholesalerEmail = order.WholesalerEmail, NewStatus = message.Request.Status,
            DriverId = message.Request.DriverId, ChangedAt = DateTime.UtcNow
        });

        return true;
    }
}
