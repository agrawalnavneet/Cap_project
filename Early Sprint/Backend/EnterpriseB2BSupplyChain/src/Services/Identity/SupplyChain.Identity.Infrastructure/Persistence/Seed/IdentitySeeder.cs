using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SupplyChain.Identity.Domain.Entities;
using SupplyChain.Identity.Domain.Enums;
using SupplyChain.Identity.Infrastructure.Services;

namespace SupplyChain.Identity.Infrastructure.Persistence.Seed;

public static class IdentitySeeder
{
    public static async Task SeedAsync(IdentityDbContext context, IConfiguration configuration)
    {
        await SeedSuperAdminAsync(context, configuration);
    }

    // ─── Super Admin ───────────────────────────────────────────────────────────
    private static async Task SeedSuperAdminAsync(IdentityDbContext context, IConfiguration configuration)
    {
        var email    = (configuration["SuperAdmin:Email"]    ?? "admin@cocacola-b2b.com").Trim().ToLowerInvariant();
        var password = configuration["SuperAdmin:Password"]  ?? "CocaCola@Admin2026!";
        var fullName = configuration["SuperAdmin:FullName"]  ?? "CocaCola B2B Admin";

        if (await context.Users.AnyAsync(u => u.Email == email))
            return;

        var hasher       = new PasswordHasherService();
        var passwordHash = hasher.Hash(password);
        var superAdmin   = User.CreateStaff(email, passwordHash, fullName, UserRole.SuperAdmin);

        await context.Users.AddAsync(superAdmin);
        await context.SaveChangesAsync();
    }

}
