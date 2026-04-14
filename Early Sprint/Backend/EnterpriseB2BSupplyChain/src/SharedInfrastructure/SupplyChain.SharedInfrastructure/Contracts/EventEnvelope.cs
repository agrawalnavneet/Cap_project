namespace SupplyChain.SharedInfrastructure.Contracts;

/// <summary>
/// Standard event envelope used when publishing domain events over RabbitMQ.
/// Wraps the payload with routing metadata for downstream consumers.
/// </summary>
/// <typeparam name="TPayload">The type of the event payload.</typeparam>
public record EventEnvelope<TPayload>(
    Guid EventId,
    string EventType,
    DateTime OccurredAt,
    string CorrelationId,
    string Source,
    TPayload Payload);
