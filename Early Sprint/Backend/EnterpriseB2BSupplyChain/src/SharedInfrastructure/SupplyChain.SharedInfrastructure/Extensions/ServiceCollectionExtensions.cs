using Microsoft.Extensions.DependencyInjection;
using SupplyChain.SharedInfrastructure.Correlation;

namespace SupplyChain.SharedInfrastructure.Extensions;

/// <summary>
/// Extension methods to register shared infrastructure services.
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSharedInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<ICorrelationIdAccessor, CorrelationIdAccessor>();
        return services;
    }
}
