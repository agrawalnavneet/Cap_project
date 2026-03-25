namespace ProductService.Domain.Entities;

public class ProductEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string SKU { get; set; } = "";
    public decimal Price { get; set; }
    public Guid CategoryId { get; set; }
    public CategoryEntity Category { get; set; } = null!;
}

public class CategoryEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public ICollection<ProductEntity> Products { get; set; } = new List<ProductEntity>();
}

public class DiscountEntity
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public decimal Percentage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive => DateTime.UtcNow >= StartDate && DateTime.UtcNow <= EndDate;
}
