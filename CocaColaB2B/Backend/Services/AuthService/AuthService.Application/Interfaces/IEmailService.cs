namespace AuthService.Application.Interfaces;

/// <summary>
/// Service for sending emails (e.g., OTP verification emails).
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends an OTP email to the specified address.
    /// </summary>
    Task<bool> SendOtpEmailAsync(string toEmail, string otpCode);
}
