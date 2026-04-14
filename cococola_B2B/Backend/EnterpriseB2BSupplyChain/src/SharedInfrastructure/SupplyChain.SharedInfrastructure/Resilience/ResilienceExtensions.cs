using Microsoft.Extensions.DependencyInjection;
using Polly;

namespace SupplyChain.SharedInfrastructure.Resilience;

/// <summary>
/// Provides HTTP client resilience policy extensions for service-to-service calls.
/// </summary>
public static class ResilienceExtensions
{
    /// <summary>
    /// Adds standard resilience policies (retry with exponential backoff) to an HTTP client builder.
    /// </summary>
    public static IHttpClientBuilder AddStandardResiliencePolicies(this IHttpClientBuilder builder)
    {
        builder.AddTransientHttpErrorPolicy(policy =>
            policy.WaitAndRetryAsync(3, attempt =>
                TimeSpan.FromSeconds(Math.Pow(2, attempt))));

        return builder;
    }
}
