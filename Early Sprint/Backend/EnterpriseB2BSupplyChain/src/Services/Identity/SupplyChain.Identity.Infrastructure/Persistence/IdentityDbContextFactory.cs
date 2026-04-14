using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SupplyChain.Identity.Infrastructure.Persistence;

public class IdentityDbContextFactory : IDesignTimeDbContextFactory<IdentityDbContext>
{
    public IdentityDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<IdentityDbContext>();

        var connectionString =
            Environment.GetEnvironmentVariable("IDENTITY_DB_CONNECTION")
            ?? "Server=127.0.0.1,1433;Database=CocaCola_IdentityDb;User Id=sa;Password=Agarwal@15;TrustServerCertificate=True;MultipleActiveResultSets=True;";

        optionsBuilder.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure(3));

        return new IdentityDbContext(optionsBuilder.Options);
    }
}
