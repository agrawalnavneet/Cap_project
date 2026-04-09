using CocaColaB2B.Shared.Logging;
using CocaColaB2B.Shared.Middleware;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Serilog;

SerilogConfiguration.ConfigureBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

    builder.Host.UseSerilog((ctx, services, loggerConfig) =>
        SerilogConfiguration.ConfigureFromSettings(ctx, services, loggerConfig, "Gateway"));

    // Forward Authorization + Correlation-ID headers to every downstream service
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddTransient<AuthorizationHeaderForwardingHandler>();

    builder.Services.AddOcelot(builder.Configuration)
        .AddDelegatingHandler<AuthorizationHeaderForwardingHandler>(global: true);

    builder.Services.AddCors(o => o.AddPolicy("All", p =>
        p.WithOrigins("http://localhost:4200", "http://localhost:5010", "http://frontend")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()));

    var app = builder.Build();

    app.UseWebSockets();

    // Assign/propagate correlation ID at the gateway edge — all downstream
    // services will receive it via the forwarding handler below
    app.UseMiddleware<CorrelationIdMiddleware>();

    app.UseSerilogRequestLogging(opts =>
    {
        opts.EnrichDiagnosticContext = (diagCtx, httpCtx) =>
        {
            diagCtx.Set("RequestHost", httpCtx.Request.Host.Value ?? "");
            diagCtx.Set("RequestScheme", httpCtx.Request.Scheme);
            diagCtx.Set("CorrelationId", httpCtx.Items[CorrelationIdMiddleware.HeaderName] ?? "");
        };
        opts.GetLevel = (httpCtx, elapsed, ex) =>
            ex != null || httpCtx.Response.StatusCode >= 500
                ? Serilog.Events.LogEventLevel.Error
                : httpCtx.Response.StatusCode >= 400
                    ? Serilog.Events.LogEventLevel.Warning
                    : Serilog.Events.LogEventLevel.Information;
    });

    app.UseCors("All");

    await app.UseOcelot();
    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Gateway terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>
/// Forwards Authorization and X-Correlation-ID headers to all downstream services.
/// Ocelot strips both by default — this handler re-attaches them.
/// </summary>
public class AuthorizationHeaderForwardingHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthorizationHeaderForwardingHandler(IHttpContextAccessor httpContextAccessor)
        => _httpContextAccessor = httpContextAccessor;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var httpCtx = _httpContextAccessor.HttpContext;
        if (httpCtx is not null)
        {
            // Forward JWT
            var auth = httpCtx.Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(auth) && !request.Headers.Contains("Authorization"))
                request.Headers.TryAddWithoutValidation("Authorization", auth);

            // Forward correlation ID so downstream services log the same ID
            var correlationId = httpCtx.Items[CorrelationIdMiddleware.HeaderName]?.ToString()
                                ?? httpCtx.Request.Headers[CorrelationIdMiddleware.HeaderName].FirstOrDefault();
            if (!string.IsNullOrEmpty(correlationId) && !request.Headers.Contains(CorrelationIdMiddleware.HeaderName))
                request.Headers.TryAddWithoutValidation(CorrelationIdMiddleware.HeaderName, correlationId);
        }

        return await base.SendAsync(request, cancellationToken);
    }
}
