using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using MassTransit;
using OrderService.Infrastructure.Data;
using OrderService.Infrastructure.Repositories;
using OrderService.Application.Interfaces;
using OrderService.Application.UseCases.Orders;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

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
    c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer")] = new List<string>()
    });
});
builder.Services.AddSignalR();

// Infrastructure: DB Context
builder.Services.AddDbContext<OrderDbContext>(o => 
    o.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Infrastructure: Repositories
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();

// Application: MediatR CQRS
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(PlaceOrderCommandHandler).Assembly));

// Infrastructure: MassTransit RabbitMQ
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

// API: Authentication
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

// Ensure DB Created
using (var scope = app.Services.CreateScope()) 
{ 
    scope.ServiceProvider.GetRequiredService<OrderDbContext>().Database.EnsureCreated(); 
}

if (app.Environment.IsDevelopment()) 
{ 
    app.UseSwagger(); 
    app.UseSwaggerUI(); 
}

app.UseCors("All"); 
app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();
app.MapHub<OrderService.API.Hubs.OrderHub>("/hubs/orders");

app.Run();
