using Microsoft.AspNetCore.Builder;
using SupplyChain.SharedInfrastructure.Correlation;
using SupplyChain.SharedInfrastructure.Middleware;

namespace SupplyChain.SharedInfrastructure.Extensions;

/// <summary>
/// Extension methods to configure the shared infrastructure middleware pipeline.
/// </summary>
public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseSharedInfrastructure(this IApplicationBuilder app)
    {
        app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
        app.UseMiddleware<CorrelationIdMiddleware>();
        return app;
    }
}
