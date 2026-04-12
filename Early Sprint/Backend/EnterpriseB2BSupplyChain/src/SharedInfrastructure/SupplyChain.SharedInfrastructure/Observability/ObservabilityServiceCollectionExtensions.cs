using Microsoft.Extensions.DependencyInjection;

namespace SupplyChain.SharedInfrastructure.Observability;

/// <summary>
/// Extension methods to register observability services (health checks, metrics, etc.).
/// </summary>
public static class ObservabilityServiceCollectionExtensions
{
    public static IServiceCollection AddSharedObservability(this IServiceCollection services)
    {
        // Health checks are already added via builder.Services.AddHealthChecks()
        // This method is a placeholder for future observability extensions
        // such as OpenTelemetry, Prometheus metrics, distributed tracing, etc.
        return services;
    }
}
