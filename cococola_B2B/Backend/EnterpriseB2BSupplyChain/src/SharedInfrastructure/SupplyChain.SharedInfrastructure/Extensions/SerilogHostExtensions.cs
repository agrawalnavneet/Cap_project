using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;

namespace SupplyChain.SharedInfrastructure.Extensions;

/// <summary>
/// Provides shared Serilog configuration for all microservices.
/// </summary>
public static class SerilogHostExtensions
{
    public static IHostBuilder UseSharedSerilog(this IHostBuilder hostBuilder, string serviceName)
    {
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
            .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("ServiceName", serviceName)
            .WriteTo.Console(
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{ServiceName}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.File(
                $"logs/{serviceName}-.txt",
                rollingInterval: RollingInterval.Day,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] [{ServiceName}] {Message:lj}{NewLine}{Exception}")
            .CreateLogger();

        hostBuilder.UseSerilog();
        return hostBuilder;
    }
}
