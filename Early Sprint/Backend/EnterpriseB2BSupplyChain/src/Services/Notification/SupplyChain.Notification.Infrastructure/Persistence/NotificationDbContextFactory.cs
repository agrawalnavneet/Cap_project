using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SupplyChain.Notification.Infrastructure.Persistence;

public class NotificationDbContextFactory : IDesignTimeDbContextFactory<NotificationDbContext>
{
    public NotificationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<NotificationDbContext>();
        optionsBuilder.UseSqlServer("Server=127.0.0.1,1433;Database=CocaCola_NotificationDb;User Id=sa;Password=Agarwal@15;TrustServerCertificate=True;MultipleActiveResultSets=True;");
        return new NotificationDbContext(optionsBuilder.Options);
    }
}
