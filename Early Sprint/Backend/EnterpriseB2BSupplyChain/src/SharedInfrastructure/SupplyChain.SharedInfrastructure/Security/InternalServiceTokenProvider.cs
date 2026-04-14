using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace SupplyChain.SharedInfrastructure.Security;

/// <summary>
/// Provides internal JWT tokens for service-to-service authenticated HTTP calls.
/// </summary>
public interface IInternalServiceTokenProvider
{
    /// <summary>
    /// Creates a short-lived internal JWT token identifying the caller service audiance.
    /// </summary>
    /// <param name="audience">The target service audience (e.g., "payment", "identity").</param>
    string CreateToken(string audience);
}

/// <summary>
/// Default implementation that creates HS256-signed JWTs using the shared Jwt:Secret key.
/// </summary>
public class InternalServiceTokenProvider : IInternalServiceTokenProvider
{
    private readonly string _secret;
    private readonly string _issuer;

    public InternalServiceTokenProvider(IConfiguration configuration)
    {
        _secret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
        _issuer = configuration["Jwt:Issuer"] ?? "SupplyChainAPI";
    }

    public string CreateToken(string audience)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, "internal-service"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(InternalAuthDefaults.ClientTypeClaim, InternalAuthDefaults.InternalClientType)
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

/// <summary>
/// Extension to register the token provider in the DI container.
/// </summary>
public static class InternalServiceTokenProviderExtensions
{
    public static IServiceCollection AddInternalServiceTokenProvider(this IServiceCollection services)
    {
        services.AddSingleton<IInternalServiceTokenProvider, InternalServiceTokenProvider>();
        return services;
    }
}
