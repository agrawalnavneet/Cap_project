using PaymentService.Domain.Entities;

namespace PaymentService.Application.Interfaces;

public interface IPaymentRepository
{
    Task<PaymentEntity?> GetByIdAsync(Guid id);
    Task<PaymentEntity?> GetByOrderIdAsync(Guid orderId);
    Task<PaymentEntity?> GetByRazorpayOrderIdAsync(string razorpayOrderId);
    Task<List<PaymentEntity>> GetAllAsync();
    Task AddAsync(PaymentEntity payment);
    Task UpdateAsync(PaymentEntity payment);
}

public interface IRazorpayService
{
    Task<(string orderId, string receiptId)> CreateOrderAsync(decimal amount, string currency, string receipt);
    bool VerifySignature(string orderId, string paymentId, string signature);
}
