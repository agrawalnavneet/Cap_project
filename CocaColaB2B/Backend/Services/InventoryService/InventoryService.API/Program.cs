using InventoryService.Infrastructure.Consumers;
using InventoryService.Infrastructure.Data;
using InventoryService.Domain.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MassTransit;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<InventoryDbContext>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<OrderPlacedConsumer>();
    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMQ:Host"] ?? "localhost", "/", h => { h.Username("guest"); h.Password("guest"); });
        cfg.ConfigureEndpoints(ctx);
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        ValidateIssuer = false, ValidateAudience = false
    };
});
builder.Services.AddCors(o => o.AddPolicy("All", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
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
    }
}

if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.UseCors("All"); app.UseAuthentication(); app.UseAuthorization();
app.MapControllers();
app.Run();
