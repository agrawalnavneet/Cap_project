using System.Collections.Concurrent;
using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;

namespace AuthService.Infrastructure.Services;

/// <summary>
/// In-memory OTP service. Generates 6-digit OTPs and stores them with a 5-minute expiry.
/// Uses ConcurrentDictionary for thread safety.
/// </summary>
public class OtpService : IOtpService
{
    // Thread-safe dictionary: email → OtpRecord
    private static readonly ConcurrentDictionary<string, OtpRecord> _otpStore = new();

    /// <summary>
    /// Generates a random 6-digit OTP for the given email and stores it.
    /// Any previous OTP for the same email is overwritten.
    /// </summary>
    public string GenerateOtp(string email)
    {
        // Generate a random 6-digit number (100000 to 999999)
        var random = new Random();
        var code = random.Next(100000, 999999).ToString();

        var otpRecord = new OtpRecord
        {
            Email = email.ToLower().Trim(),
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5), // OTP valid for 5 minutes
            IsUsed = false
        };

        // Store (or overwrite) the OTP for this email
        _otpStore[email.ToLower().Trim()] = otpRecord;

        Console.WriteLine($"[OTP] Generated OTP {code} for {email} (expires at {otpRecord.ExpiresAt} UTC)");
        return code;
    }

    /// <summary>
    /// Verifies the OTP code for the given email.
    /// Returns true only if: OTP exists, matches, not expired, and not already used.
    /// </summary>
    public bool VerifyOtp(string email, string code)
    {
        var key = email.ToLower().Trim();

        // Check if OTP exists for this email
        if (!_otpStore.TryGetValue(key, out var otpRecord))
        {
            Console.WriteLine($"[OTP] No OTP found for {email}");
            return false;
        }

        // Check if OTP is already used
        if (otpRecord.IsUsed)
        {
            Console.WriteLine($"[OTP] OTP for {email} was already used");
            return false;
        }

        // Check if OTP has expired
        if (DateTime.UtcNow > otpRecord.ExpiresAt)
        {
            Console.WriteLine($"[OTP] OTP for {email} has expired");
            _otpStore.TryRemove(key, out _); // Clean up expired OTP
            return false;
        }

        // Check if code matches
        if (otpRecord.Code != code)
        {
            Console.WriteLine($"[OTP] Invalid OTP code for {email}");
            return false;
        }

        // Mark OTP as used so it can't be reused
        otpRecord.IsUsed = true;
        Console.WriteLine($"[OTP] OTP verified successfully for {email}");

        // Remove from store after successful verification
        _otpStore.TryRemove(key, out _);
        return true;
    }
}
