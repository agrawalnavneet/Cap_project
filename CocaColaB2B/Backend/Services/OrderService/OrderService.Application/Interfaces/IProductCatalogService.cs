namespace OrderService.Application.Interfaces;

public sealed class ProductSnapshot
{
    public Guid Id { get; init; }
    public string Name { get; init; } = "";
    public decimal Price { get; init; }
}

public interface IProductCatalogService
{
    Task<ProductSnapshot?> GetProductAsync(Guid productId, CancellationToken cancellationToken = default);
}
