namespace AuthService.Domain.Entities;

/// <summary>
/// Represents a one-time password record for email verification.
/// </summary>
public class OtpRecord
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;
}
