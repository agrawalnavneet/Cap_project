using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SupplyChain.Logistics.Infrastructure.Persistence;

public class LogisticsDbContextFactory : IDesignTimeDbContextFactory<LogisticsDbContext>
{
    public LogisticsDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<LogisticsDbContext>();
        optionsBuilder.UseSqlServer("Server=127.0.0.1,1433;Database=CocaCola_LogisticsDb;User Id=sa;Password=Agarwal@15;TrustServerCertificate=True;MultipleActiveResultSets=True;");
        
        return new LogisticsDbContext(optionsBuilder.Options);
    }
}
