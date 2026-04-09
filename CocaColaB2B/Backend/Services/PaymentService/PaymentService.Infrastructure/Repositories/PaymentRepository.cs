using Microsoft.EntityFrameworkCore;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;
using PaymentService.Infrastructure.Data;

namespace PaymentService.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly PaymentDbContext _context;
    public PaymentRepository(PaymentDbContext context) => _context = context;

    public async Task<PaymentEntity?> GetByIdAsync(Guid id) => await _context.Payments.FindAsync(id);
    public async Task<PaymentEntity?> GetByOrderIdAsync(Guid orderId) => await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
    public async Task<PaymentEntity?> GetByRazorpayOrderIdAsync(string razorpayOrderId) => await _context.Payments.FirstOrDefaultAsync(p => p.RazorpayOrderId == razorpayOrderId);
    public async Task<List<PaymentEntity>> GetAllAsync() => await _context.Payments.OrderByDescending(p => p.CreatedAt).ToListAsync();
    public async Task AddAsync(PaymentEntity payment) { await _context.Payments.AddAsync(payment); await _context.SaveChangesAsync(); }
    public async Task UpdateAsync(PaymentEntity payment) { _context.Payments.Update(payment); await _context.SaveChangesAsync(); }
}
