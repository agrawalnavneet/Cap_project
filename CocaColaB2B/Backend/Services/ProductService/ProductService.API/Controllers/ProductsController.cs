using CocaColaB2B.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using ProductService.Domain.Entities;
using ProductService.Infrastructure.Data;
using System.Text.Json;

namespace ProductService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductDbContext _db;
    private readonly IDistributedCache _cache;

    public ProductsController(ProductDbContext db, IDistributedCache cache) { _db = db; _cache = cache; }

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetProducts()
    {
        var cached = await _cache.GetStringAsync("products:all");
        if (cached != null) return Ok(JsonSerializer.Deserialize<List<ProductDto>>(cached));

        var products = await _db.Products.Include(p => p.Category).ToListAsync();
        var discounts = await _db.Discounts.ToListAsync();
        var result = products.Select(p => new ProductDto
        {
            Id = p.Id, Name = p.Name, Description = p.Description, ImageUrl = p.ImageUrl,
            SKU = p.SKU, Price = p.Price, CategoryId = p.CategoryId,
            CategoryName = p.Category?.Name, QuantityInStock = 0,
            DiscountPercentage = discounts.FirstOrDefault(d => d.ProductId == p.Id && d.IsActive)?.Percentage
        }).ToList();

        await _cache.SetStringAsync("products:all", JsonSerializer.Serialize(result), new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
    {
        var p = await _db.Products.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();
        return Ok(new ProductDto { Id = p.Id, Name = p.Name, Description = p.Description, ImageUrl = p.ImageUrl, SKU = p.SKU, Price = p.Price, CategoryId = p.CategoryId, CategoryName = p.Category?.Name });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductDto>> CreateProduct(CreateProductRequest req)
    {
        var product = new ProductEntity { Name = req.Name, Description = req.Description, ImageUrl = req.ImageUrl, SKU = req.SKU, Price = req.Price, CategoryId = req.CategoryId };
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        await _cache.RemoveAsync("products:all");
        return Ok(new ProductDto { Id = product.Id, Name = product.Name, SKU = product.SKU, Price = product.Price, CategoryId = product.CategoryId });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateProduct(Guid id, UpdateProductRequest req)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return NotFound();
        p.Name = req.Name; p.Description = req.Description; p.ImageUrl = req.ImageUrl; p.SKU = req.SKU; p.Price = req.Price; p.CategoryId = req.CategoryId;
        await _db.SaveChangesAsync();
        await _cache.RemoveAsync("products:all");
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteProduct(Guid id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return NotFound();
        _db.Products.Remove(p);
        await _db.SaveChangesAsync();
        await _cache.RemoveAsync("products:all");
        return NoContent();
    }
}
