using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using OrderService.Application.Interfaces;

namespace OrderService.Infrastructure.Services;

public sealed class ProductCatalogService : IProductCatalogService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ProductCatalogService> _logger;

    public ProductCatalogService(HttpClient httpClient, ILogger<ProductCatalogService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ProductSnapshot?> GetProductAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/products/{productId}", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Product lookup failed for {ProductId}. Status: {StatusCode}", productId, response.StatusCode);
                return null;
            }

            var product = await response.Content.ReadFromJsonAsync<ProductResponse>(cancellationToken: cancellationToken);
            if (product is null || product.Id == Guid.Empty || string.IsNullOrWhiteSpace(product.Name) || product.Price <= 0)
            {
                _logger.LogWarning("Product lookup returned invalid payload for {ProductId}", productId);
                return null;
            }

            return new ProductSnapshot
            {
                Id = product.Id,
                Name = product.Name.Trim(),
                Price = product.Price
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while fetching product {ProductId} from ProductService", productId);
            return null;
        }
    }

    private sealed class ProductResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
    }
}
