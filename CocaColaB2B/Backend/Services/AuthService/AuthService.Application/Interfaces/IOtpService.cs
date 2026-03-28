namespace AuthService.Application.Interfaces;

/// <summary>
/// Service for generating and verifying OTPs.
/// </summary>
public interface IOtpService
{
    /// <summary>
    /// Generates a 6-digit OTP for the given email and stores it with a 5-minute expiry.
    /// </summary>
    string GenerateOtp(string email);

    /// <summary>
    /// Verifies the OTP code for the given email. Returns true if valid and not expired.
    /// </summary>
    bool VerifyOtp(string email, string code);
}
