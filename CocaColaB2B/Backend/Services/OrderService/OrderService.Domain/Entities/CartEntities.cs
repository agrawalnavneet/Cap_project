namespace OrderService.Domain.Entities;

public class CartEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<CartItemEntity> Items { get; set; } = new List<CartItemEntity>();
}

public class CartItemEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CartId { get; set; }
    public CartEntity Cart { get; set; } = null!;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public decimal ProductPrice { get; set; }
    public int Quantity { get; set; }
}
