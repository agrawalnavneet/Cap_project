using Microsoft.AspNetCore.Http;
using Serilog.Context;

namespace CocaColaB2B.Shared.Middleware;

/// <summary>
/// Reads or generates a Correlation-ID for every request and propagates it
/// through the response headers so callers can trace a request across services.
/// </summary>
public class CorrelationIdMiddleware
{
    public const string HeaderName = "X-Correlation-ID";

    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        // Honour an incoming correlation ID (e.g. forwarded by the gateway)
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault()
                            ?? Guid.NewGuid().ToString("N");

        context.Items[HeaderName] = correlationId;

        // Expose it on the response so the caller can correlate
        context.Response.OnStarting(() =>
        {
            context.Response.Headers.TryAdd(HeaderName, correlationId);
            return Task.CompletedTask;
        });

        // Push into Serilog's LogContext so every log line in this request carries it
        using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }
}
