using CocaColaB2B.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductService.Data;

namespace ProductService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ProductDbContext _db;
    public CategoriesController(ProductDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> Get()
    {
        var cats = await _db.Categories.Include(c => c.Products).ToListAsync();
        return Ok(cats.Select(c => new CategoryDto { Id = c.Id, Name = c.Name, Description = c.Description, ProductCount = c.Products.Count }));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CategoryDto>> Create(CreateCategoryRequest req)
    {
        var cat = new CategoryEntity { Name = req.Name, Description = req.Description };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();
        return Ok(new CategoryDto { Id = cat.Id, Name = cat.Name, Description = cat.Description });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Update(Guid id, CreateCategoryRequest req)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();
        cat.Name = req.Name; cat.Description = req.Description;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();
        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
