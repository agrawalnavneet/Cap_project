namespace CocaColaB2B.Shared.Events;

// MassTransit event contracts for inter-service communication

public record OrderPlacedEvent
{
    public Guid OrderId { get; init; }
    public Guid WholesalerId { get; init; }
    public string WholesalerEmail { get; init; } = string.Empty;
    public string WholesalerName { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public string ShippingAddress { get; init; } = string.Empty;
    public List<OrderItemEvent> Items { get; init; } = new();
    public DateTime OrderDate { get; init; }
}

public record OrderStatusChangedEvent
{
    public Guid OrderId { get; init; }
    public Guid WholesalerId { get; init; }
    public string WholesalerEmail { get; init; } = string.Empty;
    public string WholesalerName { get; init; } = string.Empty;
    public string NewStatus { get; init; } = string.Empty;
    public Guid? DriverId { get; init; }
    public string ShippingAddress { get; init; } = string.Empty;
    public decimal OrderTotal { get; init; }
    public DateTime ChangedAt { get; init; }
}

public record OrderItemEvent
{
    public Guid ProductId { get; init; }
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
}

public record StockDeductedEvent
{
    public Guid ProductId { get; init; }
    public int QuantityDeducted { get; init; }
    public int RemainingStock { get; init; }
}

public record LowStockAlertEvent
{
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public int CurrentStock { get; init; }
    public int ReorderLevel { get; init; }
}

public record DeliveryAssignedEvent
{
    public Guid OrderId { get; init; }
    public Guid DriverId { get; init; }
    public string ShippingAddress { get; init; } = string.Empty;
}

public record ProductCreatedEvent
{
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public string ProductSKU { get; init; } = string.Empty;
    public int InitialStock { get; init; }
    public int ReorderLevel { get; init; } = 100;
}

// ──── Payment Events ────
public record PaymentVerifiedEvent
{
    public Guid OrderId { get; init; }
    public Guid PaymentId { get; init; }
    public string RazorpayPaymentId { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public DateTime VerifiedAt { get; init; }
}

public record PaymentFailedEvent
{
    public Guid OrderId { get; init; }
    public Guid PaymentId { get; init; }
    public string Reason { get; init; } = string.Empty;
    public DateTime FailedAt { get; init; }
}
