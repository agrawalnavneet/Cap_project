namespace PaymentService.Domain.Entities;

public class PaymentEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? RazorpayOrderId { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public string? RazorpaySignature { get; set; }
    public string Status { get; set; } = "Created"; // Created, Paid, Failed, Refunded
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
