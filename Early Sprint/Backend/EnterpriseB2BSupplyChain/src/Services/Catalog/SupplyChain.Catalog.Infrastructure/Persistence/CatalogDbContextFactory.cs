using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SupplyChain.Catalog.Infrastructure.Persistence;

public class CatalogDbContextFactory : IDesignTimeDbContextFactory<CatalogDbContext>
{
    public CatalogDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<CatalogDbContext>();

        var connectionString =
            Environment.GetEnvironmentVariable("CATALOG_DB_CONNECTION")
            ?? "Server=127.0.0.1,1433;Database=CocaCola_CatalogDb;User Id=sa;Password=Agarwal@15;TrustServerCertificate=True;MultipleActiveResultSets=True;";

        optionsBuilder.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure(3));

        return new CatalogDbContext(optionsBuilder.Options);
    }
}
