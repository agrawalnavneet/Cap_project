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
    private readonly ICartRepository _cartRepository;
    private readonly IPublishEndpoint _publish;

    public PlaceOrderCommandHandler(IOrderRepository repository, ICartRepository cartRepository, IPublishEndpoint publish)
    {
        _repository = repository;
        _cartRepository = cartRepository;
        _publish = publish;
    }

    public async Task<OrderDto> Handle(PlaceOrderCommand message, CancellationToken cancellationToken)
    {
        var req = message.Request;

        var cart = await _cartRepository.GetCartByUserIdAsync(message.UserId);
        if (cart == null || !cart.Items.Any())
            throw new InvalidOperationException("Cart is empty. Cannot place order.");

        var order = new OrderEntity
        {
            WholesalerId = message.UserId,
            WholesalerName = message.UserName,
            WholesalerEmail = message.UserEmail,
            ShippingAddress = req.ShippingAddress
        };

        decimal total = 0;
        var eventItems = new List<OrderItemEvent>();

        foreach (var cartItem in cart.Items)
        {
            var oi = new OrderItemEntity
            {
                OrderId = order.Id,
                ProductId = cartItem.ProductId,
                ProductName = cartItem.ProductName,
                Quantity = cartItem.Quantity,
                UnitPrice = cartItem.ProductPrice
            };
            total += oi.Quantity * oi.UnitPrice;
            order.Items.Add(oi);
            eventItems.Add(new OrderItemEvent { ProductId = cartItem.ProductId, Quantity = cartItem.Quantity, UnitPrice = cartItem.ProductPrice });
        }
        order.TotalAmount = total;

        await _repository.AddOrderAsync(order);
        await _cartRepository.ClearCartItemsAsync(cart.Id);

        // Publish event — fire-and-forget so a RabbitMQ outage doesn't fail the order
        try
        {
            await _publish.Publish(new OrderPlacedEvent
            {
                OrderId = order.Id, WholesalerId = message.UserId, WholesalerEmail = message.UserEmail,
                WholesalerName = message.UserName, TotalAmount = total, ShippingAddress = req.ShippingAddress,
                Items = eventItems, OrderDate = order.OrderDate
            });
        }
        catch (Exception ex)
        {
            // Log but don't fail the order — message bus is non-critical for order creation
            Console.WriteLine($"[WARN] Failed to publish OrderPlacedEvent: {ex.Message}");
        }

        return new OrderDto
        {
            Id = order.Id, TotalAmount = total, Status = "Pending",
            OrderDate = order.OrderDate, ShippingAddress = order.ShippingAddress,
            WholesalerId = message.UserId, WholesalerName = message.UserName,
            PaymentStatus = order.PaymentStatus,
            Items = order.Items.Select(i => new OrderItemDto
            {
                Id = i.Id, ProductId = i.ProductId, ProductName = i.ProductName,
                Quantity = i.Quantity, UnitPrice = i.UnitPrice, TotalPrice = i.Quantity * i.UnitPrice
            }).ToList()
        };
    }
}

public record UpdateOrderStatusCommand(Guid Id, UpdateOrderStatusRequest Request) : IRequest<bool>;

public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, bool>
{
    private readonly IOrderRepository _repository;
    private readonly IPublishEndpoint _publish;
    private readonly IOrderHubNotifier _hubNotifier;

    public UpdateOrderStatusCommandHandler(IOrderRepository repository, IPublishEndpoint publish, IOrderHubNotifier hubNotifier)
    {
        _repository = repository;
        _publish = publish;
        _hubNotifier = hubNotifier;
    }

    public async Task<bool> Handle(UpdateOrderStatusCommand message, CancellationToken cancellationToken)
    {
        var order = await _repository.GetOrderByIdAsync(message.Id);
        if (order == null) return false;

        order.Status = message.Request.Status;
        if (message.Request.DriverId.HasValue) order.DriverId = message.Request.DriverId;
        await _repository.UpdateOrderAsync(order);

        // Publish event — fire-and-forget so RabbitMQ outage doesn't fail the status update
        try
        {
            await _publish.Publish(new OrderStatusChangedEvent
            {
                OrderId = order.Id, WholesalerId = order.WholesalerId,
                WholesalerEmail = order.WholesalerEmail,
                WholesalerName = order.WholesalerName,
                NewStatus = message.Request.Status,
                DriverId = message.Request.DriverId,
                ShippingAddress = order.ShippingAddress,
                OrderTotal = order.TotalAmount,
                ChangedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] Failed to publish OrderStatusChangedEvent: {ex.Message}");
        }

        // BUG-11 FIX: Broadcast order status via SignalR (correct event name + data shape)
        await _hubNotifier.NotifyOrderStatusChanged(
            order.Id,
            message.Request.Status,
            order.WholesalerId,
            order.DriverId,
            null,  // DriverName not stored on entity; frontend refreshes full list on event
            cancellationToken
        );

        return true;
    }
}
