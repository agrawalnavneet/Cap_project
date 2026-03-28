using AuthService.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace AuthService.Infrastructure.Services;

/// <summary>
/// Email service using MailKit to send OTP emails via Gmail SMTP.
/// Reads SMTP settings from appsettings.json "EmailSettings" section.
/// </summary>
public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    /// <summary>
    /// Sends an OTP verification email to the specified address.
    /// Returns true if sent successfully, false on failure.
    /// </summary>
    public async Task<bool> SendOtpEmailAsync(string toEmail, string otpCode)
    {
        try
        {
            // Read settings from appsettings.json
            var smtpServer = _config["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            var port = int.Parse(_config["EmailSettings:Port"] ?? "587");
            var senderEmail = _config["EmailSettings:SenderEmail"] ?? "";
            var senderName = _config["EmailSettings:SenderName"] ?? "CocaCola B2B";
            var appPassword = _config["EmailSettings:AppPassword"] ?? "";

            // Validate sender email and app password
            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(appPassword))
            {
                Console.WriteLine("[Email] Error: SenderEmail or AppPassword is not configured in appsettings.json");
                return false;
            }

            // Build the email message
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = "Your OTP Verification Code - CocaCola B2B";

            // Create a nice HTML email body
            message.Body = new TextPart("html")
            {
                Text = $@"
                <div style='font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #E61E2A; text-align: center;'>🔒 OTP Verification</h2>
                    <p style='font-size: 16px; color: #333;'>Hello,</p>
                    <p style='font-size: 16px; color: #333;'>Your One-Time Password (OTP) for verification is:</p>
                    <div style='background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #E61E2A;'>{otpCode}</span>
                    </div>
                    <p style='font-size: 14px; color: #666;'>⏰ This OTP is valid for <strong>5 minutes</strong>.</p>
                    <p style='font-size: 14px; color: #666;'>If you did not request this, please ignore this email.</p>
                    <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='font-size: 12px; color: #999; text-align: center;'>CocaCola B2B Inventory Management System</p>
                </div>"
            };

            // Connect to SMTP server and send
            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(smtpServer, port, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(senderEmail, appPassword);
            await smtp.SendAsync(message);
            await smtp.DisconnectAsync(true);

            Console.WriteLine($"[Email] OTP email sent successfully to {toEmail}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Email] Failed to send OTP email to {toEmail}: {ex.Message}");
            return false;
        }
    }
}
