using Microsoft.EntityFrameworkCore;
using AuthService.Domain.Entities;

namespace AuthService.Infrastructure.Data;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }
    public DbSet<UserEntity> Users => Set<UserEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.Property(e => e.IsVerified).HasDefaultValue(false);
            entity.Property(e => e.OtpResendCount).HasDefaultValue(0);
            entity.Property(e => e.CreditPoints).HasDefaultValue(0);
            entity.Property(e => e.WeeklyUnitsPurchased).HasDefaultValue(0);

            // Optional string columns — max lengths for DB efficiency
            entity.Property(e => e.EnterpriseName).HasMaxLength(200);
            entity.Property(e => e.GstinNumber).HasMaxLength(15);
            entity.Property(e => e.VehicleType).HasMaxLength(100);
        });
    }
}
