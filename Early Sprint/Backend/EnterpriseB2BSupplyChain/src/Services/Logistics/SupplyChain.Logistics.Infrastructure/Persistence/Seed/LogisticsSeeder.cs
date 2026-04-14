namespace SupplyChain.Logistics.Infrastructure.Persistence.Seed;

public static class LogisticsSeeder
{
    public static Task SeedAsync(LogisticsDbContext context)
    {
        // No hardcoded delivery agent or vehicle seed data.
        // Entities will be added through normal application flows.
        return Task.CompletedTask;
    }
}
