using Microsoft.Extensions.DependencyInjection;
using SupplyChain.SharedInfrastructure.Correlation;
using SupplyChain.SharedInfrastructure.Security;

namespace SupplyChain.SharedInfrastructure.Extensions;

/// <summary>
/// Extension methods to register shared infrastructure services.
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSharedInfrastructure(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddTransient<CorrelationIdDelegatingHandler>();
        services.AddSingleton<ICorrelationIdAccessor, CorrelationIdAccessor>();
        services.AddInternalServiceTokenProvider();
        return services;
    }
}
