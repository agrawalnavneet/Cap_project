using AuthService.Application.Interfaces;
using AuthService.Infrastructure.Data;
using AuthService.Infrastructure.Repositories;
using AuthService.Infrastructure.Services;
using CocaColaB2B.Shared.Logging;
using CocaColaB2B.Shared.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;
using System.Text;

// ── Bootstrap logger (captures startup crashes before DI is ready) ──────────
SerilogConfiguration.ConfigureBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ──────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, loggerConfig) =>
        SerilogConfiguration.ConfigureFromSettings(ctx, services, loggerConfig, "AuthService"));

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Auth Service API", Version = "v1" });
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

    builder.Services.AddDbContext<AuthDbContext>(o => o.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)));

    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IEmailService, EmailService>();
    builder.Services.AddSingleton<IOtpService, OtpService>();

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

    // ── DB init with retry ───────────────────────────────────────────────────
    for (int i = 0; i < 10; i++)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            scope.ServiceProvider.GetRequiredService<AuthDbContext>().Database.EnsureCreated();
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

    // ── Middleware pipeline ──────────────────────────────────────────────────
    app.UseMiddleware<CorrelationIdMiddleware>();   // must be first
    app.UseSerilogRequestLogging(opts =>           // structured HTTP request logs
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
    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "AuthService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
