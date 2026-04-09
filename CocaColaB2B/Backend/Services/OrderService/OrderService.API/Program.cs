using CocaColaB2B.Shared.Logging;
using CocaColaB2B.Shared.Middleware;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using OrderService.Application.Interfaces;
using OrderService.Application.UseCases.Orders;
using OrderService.Infrastructure.Consumers;
using OrderService.Infrastructure.Data;
using OrderService.Infrastructure.Repositories;
using OrderService.Infrastructure.Services;
using Serilog;
using System.Text;

SerilogConfiguration.ConfigureBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, services, loggerConfig) =>
        SerilogConfiguration.ConfigureFromSettings(ctx, services, loggerConfig, "OrderService"));

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Order Service API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer {token}'",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer")] = new List<string>()
        });
    });
    builder.Services.AddSignalR();

    builder.Services.AddDbContext<OrderDbContext>(o =>
        o.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
            sqlOptions => sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)));

    builder.Services.AddScoped<IOrderRepository, OrderRepository>();
    builder.Services.AddScoped<ICartRepository, CartRepository>();
    builder.Services.AddHttpClient<IProductCatalogService, ProductCatalogService>(client =>
    {
        client.BaseAddress = new Uri(builder.Configuration["ProductService:BaseUrl"] ?? "http://product-service:5302");
        client.Timeout = TimeSpan.FromSeconds(10);
    });
    builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(PlaceOrderCommandHandler).Assembly));
    builder.Services.AddScoped<IOrderHubNotifier, OrderService.API.Services.OrderHubNotifier>();

    builder.Services.AddMassTransit(x =>
    {
        x.AddConsumer<PaymentVerifiedConsumer>();
        x.UsingRabbitMq((ctx, cfg) =>
        {
            cfg.Host(builder.Configuration["RabbitMQ:Host"] ?? "localhost", "/", h =>
            {
                h.Username("guest");
                h.Password("guest");
            });
            cfg.ConfigureEndpoints(ctx);
        });
    });

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

    builder.Services.AddCors(o => o.AddPolicy("All", p =>
        p.WithOrigins("http://localhost:4200", "http://localhost:5010")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()));

    var app = builder.Build();

    for (int i = 0; i < 10; i++)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            scope.ServiceProvider.GetRequiredService<OrderDbContext>().Database.EnsureCreated();
            break;
        }
        catch (Exception ex)
        {
            Log.Warning("DB not ready (attempt {Attempt}/10): {Message}", i + 1, ex.Message);
            if (i == 9) throw;
            var delay = Math.Min(1000 * (int)Math.Pow(2, i), 30000);
            await Task.Delay(delay);
        }
    }

    if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

    // Global exception handler — MUST be first in pipeline
    app.UseExceptionHandler(errApp => errApp.Run(async ctx =>
    {
        ctx.Response.StatusCode = 500;
        ctx.Response.ContentType = "application/json";
        var feature = ctx.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var msg = feature?.Error?.Message ?? "An unexpected error occurred.";
        var logger = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(feature?.Error, "Unhandled exception on {Path}: {Message}", ctx.Request.Path, msg);
        await ctx.Response.WriteAsJsonAsync(new { error = msg });
    }));

    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseSerilogRequestLogging(opts =>
    {
        opts.EnrichDiagnosticContext = (diagCtx, httpCtx) =>
        {
            diagCtx.Set("RequestHost", httpCtx.Request.Host.Value ?? "");
            diagCtx.Set("RequestScheme", httpCtx.Request.Scheme);
            diagCtx.Set("UserAgent", httpCtx.Request.Headers.UserAgent.ToString());
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
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHub<OrderService.API.Hubs.OrderHub>("/hubs/orders");
    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "OrderService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
