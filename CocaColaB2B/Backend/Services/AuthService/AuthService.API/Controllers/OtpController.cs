using AuthService.Application.Interfaces;
using CocaColaB2B.Shared.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.API.Controllers;

[ApiController]
[Route("api/auth")]
public class OtpController : ControllerBase
{
    private readonly IOtpService _otpService;
    private readonly IEmailService _emailService;
    private readonly IUserRepository _userRepo;

    public OtpController(IOtpService otpService, IEmailService emailService, IUserRepository userRepo)
    {
        _otpService = otpService;
        _emailService = emailService;
        _userRepo = userRepo;
    }

    /// <summary>
    /// Resends OTP to the user's email. Max 3 resends allowed.
    /// </summary>
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { success = false, message = "Email is required." });

        if (!request.Email.Contains('@') || !request.Email.Contains('.'))
            return BadRequest(new { success = false, message = "Invalid email format." });

        try
        {
            // Find user by email
            var user = await _userRepo.GetByEmailAsync(request.Email);
            if (user == null)
                return BadRequest(new { success = false, message = "No account found with this email." });

            if (user.IsVerified)
                return BadRequest(new { success = false, message = "Email is already verified." });

            // Check resend limit (max 3 times)
            if (user.OtpResendCount >= 3)
                return BadRequest(new { success = false, message = "Maximum OTP resend limit (3) reached. Please contact support." });

            // Generate new OTP
            var otpCode = _otpService.GenerateOtp(request.Email);
            user.OtpCode = otpCode;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(5);
            user.OtpResendCount += 1;
            await _userRepo.UpdateAsync(user);

            // Send OTP via email
            var emailSent = await _emailService.SendOtpEmailAsync(request.Email, otpCode);
            if (!emailSent)
                return StatusCode(500, new { success = false, message = "Failed to send OTP email. Please try again later." });

            var remaining = 3 - user.OtpResendCount;
            return Ok(new { success = true, message = $"OTP sent successfully to your email. {remaining} resend(s) remaining." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[OtpController] Error sending OTP: {ex.Message}");
            return StatusCode(500, new { success = false, message = "An error occurred while sending OTP." });
        }
    }

    /// <summary>
    /// Verifies the OTP code and marks user as verified.
    /// </summary>
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { success = false, message = "Email is required." });

        if (string.IsNullOrWhiteSpace(request.OtpCode))
            return BadRequest(new { success = false, message = "OTP code is required." });

        try
        {
            var user = await _userRepo.GetByEmailAsync(request.Email);
            if (user == null)
                return BadRequest(new { success = false, message = "No account found with this email." });

            if (user.IsVerified)
                return Ok(new { success = true, message = "Email is already verified. You can login now." });

            // Check if OTP matches and is not expired
            if (string.IsNullOrEmpty(user.OtpCode) || user.OtpExpiry == null)
                return BadRequest(new { success = false, message = "No OTP was generated. Please request a new one." });

            if (DateTime.UtcNow > user.OtpExpiry)
                return BadRequest(new { success = false, message = "OTP has expired. Please request a new one." });

            if (user.OtpCode != request.OtpCode)
                return BadRequest(new { success = false, message = "Invalid OTP code. Please try again." });

            // Mark user as verified and clear OTP data
            user.IsVerified = true;
            user.OtpCode = null;
            user.OtpExpiry = null;
            await _userRepo.UpdateAsync(user);

            // Also mark in-memory OTP as used
            _otpService.VerifyOtp(request.Email, request.OtpCode);

            return Ok(new { success = true, message = "Email verified successfully! You can now login." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[OtpController] Error verifying OTP: {ex.Message}");
            return StatusCode(500, new { success = false, message = "An error occurred while verifying OTP." });
        }
    }
}
