using CocaColaB2B.Shared.Events;
using MassTransit;
using OrderService.Application.Interfaces;

namespace OrderService.Infrastructure.Consumers;

public class PaymentVerifiedConsumer : IConsumer<PaymentVerifiedEvent>
{
    private readonly IOrderRepository _repository;

    public PaymentVerifiedConsumer(IOrderRepository repository)
    {
        _repository = repository;
    }

    public async Task Consume(ConsumeContext<PaymentVerifiedEvent> context)
    {
        var ev = context.Message;
        var order = await _repository.GetOrderByIdAsync(ev.OrderId);
        if (order != null)
        {
            order.PaymentId = ev.PaymentId.ToString();
            order.PaymentStatus = "Paid";
            await _repository.UpdateOrderAsync(order);
            Console.WriteLine($"[PaymentVerifiedConsumer] Order {ev.OrderId} marked as Paid (Payment: {ev.RazorpayPaymentId})");
        }
    }
}
