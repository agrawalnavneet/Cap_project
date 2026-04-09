using Microsoft.EntityFrameworkCore;
using PaymentService.Domain.Entities;

namespace PaymentService.Infrastructure.Data;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options) : base(options) { }
    public DbSet<PaymentEntity> Payments => Set<PaymentEntity>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<PaymentEntity>().Property(p => p.Amount).HasPrecision(18, 2);
        m.Entity<PaymentEntity>().HasIndex(p => p.OrderId);
        m.Entity<PaymentEntity>().HasIndex(p => p.RazorpayOrderId);
    }
}
