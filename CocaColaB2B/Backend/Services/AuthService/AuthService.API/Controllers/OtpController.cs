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

    public OtpController(IOtpService otpService, IEmailService emailService)
    {
        _otpService = otpService;
        _emailService = emailService;
    }

    /// <summary>
    /// Generates a 6-digit OTP and sends it to the user's email.
    /// </summary>
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        // Validate email
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { success = false, message = "Email is required." });
        }

        // Basic email format check
        if (!request.Email.Contains('@') || !request.Email.Contains('.'))
        {
            return BadRequest(new { success = false, message = "Invalid email format." });
        }

        try
        {
            // Generate OTP
            var otpCode = _otpService.GenerateOtp(request.Email);

            // Send OTP via email
            var emailSent = await _emailService.SendOtpEmailAsync(request.Email, otpCode);

            if (!emailSent)
            {
                return StatusCode(500, new { success = false, message = "Failed to send OTP email. Please try again later." });
            }

            return Ok(new { success = true, message = "OTP sent successfully to your email." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[OtpController] Error sending OTP: {ex.Message}");
            return StatusCode(500, new { success = false, message = "An error occurred while sending OTP." });
        }
    }

    /// <summary>
    /// Verifies the OTP code entered by the user.
    /// </summary>
    [HttpPost("verify-otp")]
    public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        // Validate inputs
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { success = false, message = "Email is required." });
        }

        if (string.IsNullOrWhiteSpace(request.OtpCode))
        {
            return BadRequest(new { success = false, message = "OTP code is required." });
        }

        try
        {
            // Verify the OTP
            var isValid = _otpService.VerifyOtp(request.Email, request.OtpCode);

            if (!isValid)
            {
                return BadRequest(new { success = false, message = "Invalid or expired OTP. Please request a new one." });
            }

            return Ok(new { success = true, message = "OTP verified successfully!" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[OtpController] Error verifying OTP: {ex.Message}");
            return StatusCode(500, new { success = false, message = "An error occurred while verifying OTP." });
        }
    }
}
