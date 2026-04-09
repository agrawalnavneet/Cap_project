using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;

namespace CocaColaB2B.Shared.Logging;

/// <summary>
/// Central Serilog bootstrap used by every microservice.
/// Call <see cref="ConfigureBootstrapLogger"/> before the host is built (for
/// startup errors), then call <see cref="ConfigureFromSettings"/> once the
/// host is ready to read appsettings.json.
/// </summary>
public static class SerilogConfiguration
{
    /// <summary>
    /// Minimal logger used only during host startup (before DI is ready).
    /// Writes to console so startup crashes are always visible.
    /// </summary>
    public static void ConfigureBootstrapLogger()
    {
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Warning()
            .WriteTo.Console(outputTemplate:
                "[{Timestamp:HH:mm:ss} {Level:u3}] BOOTSTRAP | {Message:lj}{NewLine}{Exception}")
            .CreateBootstrapLogger();
    }

    /// <summary>
    /// Full logger configured from appsettings.json + enrichers.
    /// Call this inside <c>builder.Host.UseSerilog(...)</c>.
    /// </summary>
    public static void ConfigureFromSettings(
        HostBuilderContext ctx,
        IServiceProvider services,
        LoggerConfiguration loggerConfig,
        string serviceName)
    {
        var cfg = ctx.Configuration;
        var env = ctx.HostingEnvironment;

        loggerConfig
            // ── Minimum levels ──────────────────────────────────────────────
            .MinimumLevel.Is(GetMinimumLevel(cfg))
            // Suppress noisy framework namespaces
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
            .MinimumLevel.Override("MassTransit", LogEventLevel.Warning)
            .MinimumLevel.Override("System.Net.Http.HttpClient", LogEventLevel.Warning)

            // ── Enrichers ────────────────────────────────────────────────────
            .Enrich.FromLogContext()                    // CorrelationId, UserId, etc.
            .Enrich.WithMachineName()
            .Enrich.WithEnvironmentName()
            .Enrich.WithThreadId()
            .Enrich.WithProperty("ServiceName", serviceName)
            .Enrich.WithProperty("Environment", env.EnvironmentName)

            // ── Sinks ────────────────────────────────────────────────────────
            // Console — always on, human-readable in dev, JSON in prod
            .WriteTo.Console(
                restrictedToMinimumLevel: LogEventLevel.Information,
                outputTemplate: env.IsDevelopment()
                    ? "[{Timestamp:HH:mm:ss} {Level:u3}] {ServiceName} | {CorrelationId} | {Message:lj}{NewLine}{Exception}"
                    : "[{Timestamp:o} {Level:u3}] {ServiceName} | {CorrelationId} | {Message:lj} | {Properties:j}{NewLine}{Exception}")

            // Rolling file — one file per day, kept for 30 days
            .WriteTo.File(
                path: $"logs/{serviceName}-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30,
                restrictedToMinimumLevel: LogEventLevel.Information,
                outputTemplate: "{Timestamp:o} [{Level:u3}] {ServiceName} | {CorrelationId} | {SourceContext} | {Message:lj}{NewLine}{Exception}")

            // Separate error-only file for quick triage
            .WriteTo.File(
                path: $"logs/{serviceName}-errors-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30,
                restrictedToMinimumLevel: LogEventLevel.Error,
                outputTemplate: "{Timestamp:o} [{Level:u3}] {ServiceName} | {CorrelationId} | {SourceContext} | {Message:lj}{NewLine}{Exception}");

        // ── Optional: Seq ────────────────────────────────────────────────────
        var seqUrl = cfg["Serilog:SeqUrl"];
        if (!string.IsNullOrWhiteSpace(seqUrl))
        {
            loggerConfig.WriteTo.Seq(seqUrl,
                restrictedToMinimumLevel: LogEventLevel.Information);
        }

        // ── Read any extra overrides from appsettings.json ───────────────────
        loggerConfig.ReadFrom.Configuration(cfg);
    }

    private static LogEventLevel GetMinimumLevel(IConfiguration cfg)
    {
        var raw = cfg["Serilog:MinimumLevel:Default"] ?? "Information";
        return Enum.TryParse<LogEventLevel>(raw, true, out var level)
            ? level
            : LogEventLevel.Information;
    }
}
