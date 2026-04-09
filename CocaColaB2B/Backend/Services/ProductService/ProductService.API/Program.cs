using CocaColaB2B.Shared.Logging;
using CocaColaB2B.Shared.Middleware;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProductService.Domain.Entities;
using ProductService.Infrastructure.Data;
using Serilog;
using System.Text;

SerilogConfiguration.ConfigureBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, services, loggerConfig) =>
        SerilogConfiguration.ConfigureFromSettings(ctx, services, loggerConfig, "ProductService"));

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Product Service API", Version = "v1" });
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
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });
    });

    builder.Services.AddDbContext<ProductDbContext>(o => o.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)));

    builder.Services.AddStackExchangeRedisCache(o =>
    {
        o.Configuration = builder.Configuration.GetConnectionString("RedisCache");
    });

    builder.Services.AddMassTransit(x =>
    {
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
            var db = scope.ServiceProvider.GetRequiredService<ProductDbContext>();
            db.Database.EnsureCreated();
            if (!db.Products.Any())
            {
                var beverages = new CategoryEntity { Name = "Beverages", Description = "Cold drinks and sodas" };
                var juice = new CategoryEntity { Name = "Juice", Description = "Fruit juices" };
                var water = new CategoryEntity { Name = "Water", Description = "Bottled water" };
                var energy = new CategoryEntity { Name = "Energy Drinks", Description = "Energy and sports drinks" };
                db.Categories.AddRange(beverages, juice, water, energy);

                var seededProducts = new[]
                {
                    new ProductEntity { Name = "Coca-Cola Classic", SKU = "CC-001", Price = 1.99M, Description = "The original", ImageUrl = "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200", Category = beverages },
                    new ProductEntity { Name = "Diet Coke", SKU = "DC-002", Price = 1.99M, Description = "Sugar-free", ImageUrl = "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=200", Category = beverages },
                    new ProductEntity { Name = "Coca-Cola Zero", SKU = "CZ-003", Price = 2.19M, Description = "Zero sugar", ImageUrl = "https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=200", Category = beverages },
                    new ProductEntity { Name = "Sprite", SKU = "SP-004", Price = 1.89M, Description = "Lemon lime", Category = beverages },
                    new ProductEntity { Name = "Fanta Orange", SKU = "FO-005", Price = 1.79M, Description = "Orange soda", Category = beverages },
                    new ProductEntity { Name = "Minute Maid", SKU = "MM-006", Price = 2.49M, Description = "Orange juice", Category = juice },
                    new ProductEntity { Name = "Dasani Water", SKU = "DW-007", Price = 1.29M, Description = "Purified water", Category = water },
                    new ProductEntity { Name = "Monster Energy", SKU = "ME-008", Price = 3.49M, Description = "Energy drink", Category = energy }
                };
                db.Products.AddRange(seededProducts);
                db.SaveChanges();
                Log.Information("ProductService seeded with {Count} products", seededProducts.Length);
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

    // After app starts, publish ProductCreatedEvents for any seeded products that
    // don't yet have inventory records linked (MassTransit is now running).
    var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
    lifetime.ApplicationStarted.Register(async () =>
    {
        await Task.Delay(3000); // Give InventoryService time to start
        try
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ProductDbContext>();
            var bus = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();
            var stockMap = new Dictionary<string, int>
            {
                ["CC-001"] = 5000, ["DC-002"] = 3000, ["CZ-003"] = 4000, ["SP-004"] = 3500,
                ["FO-005"] = 2800, ["MM-006"] = 2000, ["DW-007"] = 10000, ["ME-008"] = 80
            };
            var products = await db.Products.ToListAsync();
            foreach (var p in products)
            {
                try
                {
                    await bus.Publish(new CocaColaB2B.Shared.Events.ProductCreatedEvent
                    {
                        ProductId = p.Id, ProductName = p.Name, ProductSKU = p.SKU,
                        InitialStock = stockMap.GetValueOrDefault(p.SKU, 1000), ReorderLevel = 100
                    });
                }
                catch (Exception ex)
                {
                    Log.Warning("Failed to publish ProductCreatedEvent for {SKU}: {Message}", p.SKU, ex.Message);
                }
            }
            Log.Information("Published ProductCreatedEvents for {Count} products to link inventory", products.Count);
        }
        catch (Exception ex)
        {
            Log.Warning("Failed to publish post-startup ProductCreatedEvents: {Message}", ex.Message);
        }
    });

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "ProductService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
