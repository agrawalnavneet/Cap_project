namespace SupplyChain.SharedInfrastructure.Security;

/// <summary>
/// Provides default values and constants for internal service-to-service authentication.
/// </summary>
public static class InternalAuthDefaults
{
    public const string InternalPolicy = "InternalService";
    public const string ClientTypeClaim = "client_type";
    public const string InternalClientType = "internal-service";
}
