using SupplyChain.SharedInfrastructure.Results;

namespace SupplyChain.Payment.Application.Abstractions;

public sealed record OrderInvoiceLineDto(
    Guid ProductId,
    string ProductName,
    string SKU,
    int Quantity,
    decimal UnitPrice
);

public sealed record OrderInvoiceDetailsDto(
    Guid OrderId,
    Guid DealerId,
    decimal TotalAmount,
    string PaymentMode,
    string? ShippingState,
    List<OrderInvoiceLineDto> Lines
);

public interface IOrderInternalClient
{
    Task<OrderInvoiceDetailsDto?> GetInvoiceDetailsAsync(Guid orderId, CancellationToken ct);
    Task AdvanceToDispatchAsync(Guid orderId, CancellationToken ct);
}
