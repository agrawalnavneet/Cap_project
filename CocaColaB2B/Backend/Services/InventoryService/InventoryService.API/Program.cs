using CocaColaB2B.Shared.Logging;
using CocaColaB2B.Shared.Middleware;
using InventoryService.Infrastructure.Consumers;
using InventoryService.Infrastructure.Data;
using InventoryService.Domain.Entities;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;
using System.Text;

SerilogConfiguration.ConfigureBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, services, loggerConfig) =>
        SerilogConfiguration.ConfigureFromSettings(ctx, services, loggerConfig, "InventoryService"));

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Inventory Service API", Version = "v1" });
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

    builder.Services.AddDbContext<InventoryDbContext>(o => o.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)));

    builder.Services.AddMassTransit(x =>
    {
        x.AddConsumer<OrderPlacedConsumer>();
        x.AddConsumer<ProductCreatedConsumer>();
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
    });
    builder.Services.AddCors(o => o.AddPolicy("All", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

    var app = builder.Build();

    for (int i = 0; i < 10; i++)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
            db.Database.EnsureCreated();
            if (!db.Inventories.Any())
            {
                db.Inventories.AddRange(
                    new InventoryEntity { ProductName = "Coca-Cola Classic", ProductSKU = "CC-001", QuantityInStock = 5000, ReorderLevel = 500 },
                    new InventoryEntity { ProductName = "Diet Coke", ProductSKU = "DC-002", QuantityInStock = 3000, ReorderLevel = 300 },
                    new InventoryEntity { ProductName = "Coca-Cola Zero", ProductSKU = "CZ-003", QuantityInStock = 4000, ReorderLevel = 400 },
                    new InventoryEntity { ProductName = "Sprite", ProductSKU = "SP-004", QuantityInStock = 3500, ReorderLevel = 350 },
                    new InventoryEntity { ProductName = "Fanta Orange", ProductSKU = "FO-005", QuantityInStock = 2800, ReorderLevel = 280 },
                    new InventoryEntity { ProductName = "Minute Maid", ProductSKU = "MM-006", QuantityInStock = 2000, ReorderLevel = 200 },
                    new InventoryEntity { ProductName = "Dasani Water", ProductSKU = "DW-007", QuantityInStock = 10000, ReorderLevel = 1000 },
                    new InventoryEntity { ProductName = "Monster Energy", ProductSKU = "ME-008", QuantityInStock = 80, ReorderLevel = 150 }
                );
                db.SaveChanges();
                Log.Information("Inventory seeded with {Count} items", 8);
            }
            break;
        }
        catch (Exception ex)
        {
            Log.Warning("DB not ready (attempt {Attempt}/10): {Message}", i + 1, ex.Message);
            if (i == 9) throw;
            await Task.Delay(5000);
        }
    }

    if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseSerilogRequestLogging(opts =>
    {
        opts.EnrichDiagnosticContext = (diagCtx, httpCtx) =>
        {
            diagCtx.Set("RequestHost", httpCtx.Request.Host.Value ?? "");
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
    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "InventoryService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
