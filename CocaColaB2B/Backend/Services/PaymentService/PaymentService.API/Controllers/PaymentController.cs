using CocaColaB2B.Shared.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.UseCases.Payments;

namespace PaymentService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(IMediator mediator, ILogger<PaymentController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Creates a Razorpay order for server-side payment processing.
    /// </summary>
    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] CreatePaymentRequest request)
    {
        if (request.OrderId == Guid.Empty || request.Amount <= 0)
            return BadRequest(new { error = "Invalid payment request. OrderId and amount are required." });

        try
        {
            var result = await _mediator.Send(new CreatePaymentCommand(request));
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid create payment request for order {OrderId}", request.OrderId);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Create payment failed for order {OrderId}", request.OrderId);
            return StatusCode(500, new { error = "Failed to create payment order." });
        }
    }

    /// <summary>
    /// Verifies payment signature server-side and marks payment as Paid.
    /// </summary>
    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest request)
    {
        if (request.PaymentId == Guid.Empty
            || string.IsNullOrWhiteSpace(request.RazorpayOrderId)
            || string.IsNullOrWhiteSpace(request.RazorpayPaymentId)
            || string.IsNullOrWhiteSpace(request.RazorpaySignature))
        {
            return BadRequest(new { error = "Invalid payment verification payload." });
        }

        try
        {
            var result = await _mediator.Send(new VerifyPaymentCommand(request));
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Payment verification failed for payment {PaymentId}", request.PaymentId);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Payment verification error for payment {PaymentId}", request.PaymentId);
            return StatusCode(500, new { error = "Failed to verify payment." });
        }
    }

    /// <summary>
    /// Gets payment status for an order.
    /// </summary>
    [HttpGet("order/{orderId}")]
    public async Task<IActionResult> GetPaymentByOrder(Guid orderId)
    {
        var result = await _mediator.Send(new GetPaymentByOrderQuery(orderId));
        if (result == null) return NotFound(new { error = "No payment found for this order." });
        return Ok(result);
    }
}
