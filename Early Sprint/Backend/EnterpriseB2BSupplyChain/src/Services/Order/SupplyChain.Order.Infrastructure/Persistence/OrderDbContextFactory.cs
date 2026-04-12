using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SupplyChain.Order.Infrastructure.Persistence;

public class OrderDbContextFactory : IDesignTimeDbContextFactory<OrderDbContext>
{
    public OrderDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<OrderDbContext>();

        var connectionString =
            Environment.GetEnvironmentVariable("ORDER_DB_CONNECTION")
            ?? "Server=127.0.0.1,1433;Database=CocaCola_OrderDb;User Id=sa;Password=Agarwal@15;TrustServerCertificate=True;MultipleActiveResultSets=True;";

        optionsBuilder.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure(3));

        return new OrderDbContext(optionsBuilder.Options);
    }
}
