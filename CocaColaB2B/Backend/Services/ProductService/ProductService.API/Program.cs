using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ProductService.Domain.Entities;
using ProductService.Infrastructure.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
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
    c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer")] = new List<string>()
    });
});

builder.Services.AddDbContext<ProductDbContext>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
    sqlOptions => sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)));
builder.Services.AddStackExchangeRedisCache(o => { o.Configuration = builder.Configuration.GetConnectionString("RedisCache"); });

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
            db.Products.AddRange(
                new ProductEntity { Name = "Coca-Cola Classic", SKU = "CC-001", Price = 1.99M, Description = "The original", ImageUrl = "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200", Category = beverages },
                new ProductEntity { Name = "Diet Coke", SKU = "DC-002", Price = 1.99M, Description = "Sugar-free", ImageUrl = "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=200", Category = beverages },
                new ProductEntity { Name = "Coca-Cola Zero", SKU = "CZ-003", Price = 2.19M, Description = "Zero sugar", ImageUrl = "https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=200", Category = beverages },
                new ProductEntity { Name = "Sprite", SKU = "SP-004", Price = 1.89M, Description = "Lemon lime", Category = beverages },
                new ProductEntity { Name = "Fanta Orange", SKU = "FO-005", Price = 1.79M, Description = "Orange soda", Category = beverages },
                new ProductEntity { Name = "Minute Maid", SKU = "MM-006", Price = 2.49M, Description = "Orange juice", Category = juice },
                new ProductEntity { Name = "Dasani Water", SKU = "DW-007", Price = 1.29M, Description = "Purified water", Category = water },
                new ProductEntity { Name = "Monster Energy", SKU = "ME-008", Price = 3.49M, Description = "Energy drink", Category = energy }
            );
            db.SaveChanges();
        }
        break;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB not ready (attempt {i + 1}/10): {ex.Message}");
        if (i == 9) throw;
        await Task.Delay(5000);
    }
}

if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.UseCors("All"); app.UseAuthentication(); app.UseAuthorization();
app.MapControllers();
app.Run();
