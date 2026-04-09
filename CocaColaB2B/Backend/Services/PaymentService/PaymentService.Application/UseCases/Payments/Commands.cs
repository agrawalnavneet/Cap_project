using CocaColaB2B.Shared.DTOs;
using CocaColaB2B.Shared.Events;
using MassTransit;
using MediatR;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;

namespace PaymentService.Application.UseCases.Payments;

// ──── Create Payment Order ────
public record CreatePaymentCommand(CreatePaymentRequest Request) : IRequest<PaymentDto>;

public class CreatePaymentCommandHandler : IRequestHandler<CreatePaymentCommand, PaymentDto>
{
    private readonly IPaymentRepository _repository;
    private readonly IRazorpayService _razorpay;

    public CreatePaymentCommandHandler(IPaymentRepository repository, IRazorpayService razorpay)
    {
        _repository = repository;
        _razorpay = razorpay;
    }

    public async Task<PaymentDto> Handle(CreatePaymentCommand message, CancellationToken cancellationToken)
    {
        var req = message.Request;

        // Create Razorpay order server-side
        var (razorpayOrderId, receiptId) = await _razorpay.CreateOrderAsync(req.Amount, req.Currency, req.OrderId.ToString());

        var payment = new PaymentEntity
        {
            OrderId = req.OrderId,
            Amount = req.Amount,
            Currency = req.Currency,
            RazorpayOrderId = razorpayOrderId,
            Status = "Created"
        };

        await _repository.AddAsync(payment);

        return new PaymentDto
        {
            Id = payment.Id,
            OrderId = payment.OrderId,
            Amount = payment.Amount,
            Currency = payment.Currency,
            RazorpayOrderId = payment.RazorpayOrderId,
            Status = payment.Status,
            CreatedAt = payment.CreatedAt
        };
    }
}

// ──── Verify Payment ────
public record VerifyPaymentCommand(VerifyPaymentRequest Request) : IRequest<PaymentDto>;

public class VerifyPaymentCommandHandler : IRequestHandler<VerifyPaymentCommand, PaymentDto>
{
    private readonly IPaymentRepository _repository;
    private readonly IRazorpayService _razorpay;
    private readonly IPublishEndpoint _publish;

    public VerifyPaymentCommandHandler(IPaymentRepository repository, IRazorpayService razorpay, IPublishEndpoint publish)
    {
        _repository = repository;
        _razorpay = razorpay;
        _publish = publish;
    }

    public async Task<PaymentDto> Handle(VerifyPaymentCommand message, CancellationToken cancellationToken)
    {
        var req = message.Request;

        var payment = await _repository.GetByIdAsync(req.PaymentId);
        if (payment == null)
            throw new InvalidOperationException("Payment not found.");

        // Verify Razorpay signature server-side
        var isValid = _razorpay.VerifySignature(req.RazorpayOrderId, req.RazorpayPaymentId, req.RazorpaySignature);

        if (isValid)
        {
            payment.RazorpayPaymentId = req.RazorpayPaymentId;
            payment.RazorpaySignature = req.RazorpaySignature;
            payment.Status = "Paid";
            payment.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(payment);

            // Publish event for OrderService to mark order as paid
            await _publish.Publish(new PaymentVerifiedEvent
            {
                OrderId = payment.OrderId,
                PaymentId = payment.Id,
                RazorpayPaymentId = req.RazorpayPaymentId,
                Amount = payment.Amount,
                VerifiedAt = DateTime.UtcNow
            });
        }
        else
        {
            payment.Status = "Failed";
            payment.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(payment);

            await _publish.Publish(new PaymentFailedEvent
            {
                OrderId = payment.OrderId,
                PaymentId = payment.Id,
                Reason = "Signature verification failed",
                FailedAt = DateTime.UtcNow
            });

            throw new InvalidOperationException("Payment verification failed. Invalid signature.");
        }

        return new PaymentDto
        {
            Id = payment.Id,
            OrderId = payment.OrderId,
            Amount = payment.Amount,
            Currency = payment.Currency,
            RazorpayOrderId = payment.RazorpayOrderId,
            RazorpayPaymentId = payment.RazorpayPaymentId,
            Status = payment.Status,
            CreatedAt = payment.CreatedAt,
            UpdatedAt = payment.UpdatedAt
        };
    }
}

// ──── Get Payment by Order ────
public record GetPaymentByOrderQuery(Guid OrderId) : IRequest<PaymentDto?>;

public class GetPaymentByOrderQueryHandler : IRequestHandler<GetPaymentByOrderQuery, PaymentDto?>
{
    private readonly IPaymentRepository _repository;

    public GetPaymentByOrderQueryHandler(IPaymentRepository repository)
    {
        _repository = repository;
    }

    public async Task<PaymentDto?> Handle(GetPaymentByOrderQuery request, CancellationToken cancellationToken)
    {
        var payment = await _repository.GetByOrderIdAsync(request.OrderId);
        if (payment == null) return null;

        return new PaymentDto
        {
            Id = payment.Id,
            OrderId = payment.OrderId,
            Amount = payment.Amount,
            Currency = payment.Currency,
            RazorpayOrderId = payment.RazorpayOrderId,
            RazorpayPaymentId = payment.RazorpayPaymentId,
            Status = payment.Status,
            CreatedAt = payment.CreatedAt,
            UpdatedAt = payment.UpdatedAt
        };
    }
}
