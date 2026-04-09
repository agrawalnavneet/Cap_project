namespace AuthService.Domain.Entities;

public class UserEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Wholesaler";
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // OTP verification fields
    public bool IsVerified { get; set; } = false;
    public string? OtpCode { get; set; }
    public DateTime? OtpExpiry { get; set; }
    public int OtpResendCount { get; set; } = 0;

    // ── Wholesaler-specific fields ────────────────────────────────────────────
    /// <summary>Registered enterprise / business name (Wholesaler only)</summary>
    public string? EnterpriseName { get; set; }

    /// <summary>GST Identification Number — 15-char alphanumeric (Wholesaler only)</summary>
    public string? GstinNumber { get; set; }

    /// <summary>Credit units granted by Admin. Wholesaler spends these to place orders.</summary>
    public int CreditPoints { get; set; } = 0;

    /// <summary>Total units purchased in the current ISO week (resets every Monday).</summary>
    public int WeeklyUnitsPurchased { get; set; } = 0;

    /// <summary>The Monday of the week for which WeeklyUnitsPurchased was last reset.</summary>
    public DateTime? WeeklyResetDate { get; set; }

    // ── Driver-specific fields ────────────────────────────────────────────────
    /// <summary>Vehicle type / details for Driver role (e.g. Bike, Van, Truck)</summary>
    public string? VehicleType { get; set; }
}
