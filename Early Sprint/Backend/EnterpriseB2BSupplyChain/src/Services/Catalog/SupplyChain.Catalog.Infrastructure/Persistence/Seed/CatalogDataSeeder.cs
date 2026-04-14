using Microsoft.EntityFrameworkCore;
using SupplyChain.Catalog.Domain.Entities;

namespace SupplyChain.Catalog.Infrastructure.Persistence.Seed;

public static class CatalogDataSeeder
{
    public static async Task SeedAsync(CatalogDbContext context)
    {
        // Add a check for Coca-Cola specific data to ensure idempotency.
        if (await context.Categories.AnyAsync(c => c.Name == "Carbonated Soft Drinks"))
            return;

        // Wipe existing legacy HUL products/categories
        if (await context.Categories.AnyAsync())
        {
            context.Products.RemoveRange(context.Products);
            context.Categories.RemoveRange(context.Categories);
            await context.SaveChangesAsync();
        }

        // ── Top-level categories ────────────────────────────────────
        var csd             = Category.Create("Carbonated Soft Drinks",  "Classic sparkling colas and sodas");
        var juice           = Category.Create("Juices",                  "Fruit juices and fruit flavored drinks");
        var water           = Category.Create("Water",                   "Packaged drinking water and flavored water");
        var sportsDrinks    = Category.Create("Sports Drinks",           "Isotonic and hydration beverages");
        var energyDrinks    = Category.Create("Energy Drinks",           "Energy boosting and performance drinks");
        var teaCoffee       = Category.Create("Tea & Coffee",            "Iced teas and cold coffee beverages");

        var allCategories = new[]
        {
            csd, juice, water, sportsDrinks, energyDrinks, teaCoffee
        };

        context.Categories.AddRange(allCategories);

        // Product.Create signature:
        // (string sku, string name, string? description, string? brand,
        //  Guid categoryId, decimal unitPrice, int minOrderQuantity, int initialStock, string? imageUrl = null)

        var products = new List<Product>
        {
            // ── Carbonated Soft Drinks ────────────────────────────────────
            Product.Create("CC-CLS-750",  "Coca-Cola Classic 750ml",     null, "Coca-Cola", csd.CategoryId, 40m, 1, 1000),
            Product.Create("CC-CLS-2L",   "Coca-Cola Classic 2L",        null, "Coca-Cola", csd.CategoryId, 95m, 1, 800),
            Product.Create("CC-ZRO-300",  "Coca-Cola Zero Sugar 300ml",  null, "Coca-Cola", csd.CategoryId, 40m, 1, 1200),
            Product.Create("SPR-LMN-750", "Sprite Lemon-Lime 750ml",     null, "Sprite",    csd.CategoryId, 40m, 1, 900),
            Product.Create("SPR-LMN-2L",  "Sprite Lemon-Lime 2L",        null, "Sprite",    csd.CategoryId, 95m, 1, 700),
            Product.Create("THM-UP-750",  "Thums Up 750ml",              null, "Thums Up",  csd.CategoryId, 40m, 1, 1500),
            Product.Create("FNT-ORG-750", "Fanta Orange 750ml",          null, "Fanta",     csd.CategoryId, 40m, 1, 600),

            // ── Juices ────────────────────────────────────
            Product.Create("MZA-MNG-600", "Maaza Mango Drink 600ml",             null, "Maaza",       juice.CategoryId, 45m, 1, 1100),
            Product.Create("MZA-MNG-1.2L","Maaza Mango Drink 1.2L",              null, "Maaza",       juice.CategoryId, 75m, 1, 800),
            Product.Create("MM-MIX-1L",   "Minute Maid Mixed Fruit 1L",          null, "Minute Maid", juice.CategoryId, 110m,1, 500),
            Product.Create("MM-APL-1L",   "Minute Maid Apple 1L",                null, "Minute Maid", juice.CategoryId, 110m,1, 450),

            // ── Water ────────────────────────────────────
            Product.Create("KIN-WTR-1L",  "Kinley Packaged Drinking Water 1L",   null, "Kinley", water.CategoryId, 20m, 1, 2000),
            Product.Create("KIN-WTR-500", "Kinley Packaged Drinking Water 500ml",null, "Kinley", water.CategoryId, 10m, 1, 2500),
            Product.Create("KIN-SDA-750", "Kinley Club Soda 750ml",              null, "Kinley", water.CategoryId, 20m, 1, 1200),
            
            // ── Sports Drinks ────────────────────────────────────
            Product.Create("PWR-BLU-500", "Powerade Mountain Berry Blast 500ml", null, "Powerade", sportsDrinks.CategoryId, 50m, 1, 300),
            Product.Create("PWR-FRT-500", "Powerade Fruit Punch 500ml",          null, "Powerade", sportsDrinks.CategoryId, 50m, 1, 300),

            // ── Energy Drinks ────────────────────────────────────
            Product.Create("MON-NRG-350", "Monster Energy Original 350ml",       null, "Monster Energy", energyDrinks.CategoryId, 110m, 1, 400),
            Product.Create("MON-ULT-350", "Monster Energy Ultra 350ml",          null, "Monster Energy", energyDrinks.CategoryId, 110m, 1, 350),

            // ── Tea & Coffee ────────────────────────────────────
            Product.Create("GST-LCH-500", "Georgia Gold Iced Tea Peach 500ml",   null, "Georgia", teaCoffee.CategoryId, 45m, 1, 500),
        };

        context.Products.AddRange(products);

        await context.SaveChangesAsync();
    }
}
