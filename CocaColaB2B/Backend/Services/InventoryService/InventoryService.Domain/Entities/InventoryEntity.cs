namespace InventoryService.Domain.Entities;

public class InventoryEntity
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public string ProductSKU { get; set; } = "";
    public int QuantityInStock { get; set; }
    public int ReorderLevel { get; set; } = 100;
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}
