namespace OrderService.Domain.Entities;

public class OrderEntity
{
    public Guid Id { get; set; }
    public Guid WholesalerId { get; set; }
    public string WholesalerName { get; set; } = "";
    public string WholesalerEmail { get; set; } = "";
    public Guid? DriverId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public string ShippingAddress { get; set; } = "";
    public ICollection<OrderItemEntity> Items { get; set; } = new List<OrderItemEntity>();
}

public class OrderItemEntity
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public OrderEntity Order { get; set; } = null!;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
