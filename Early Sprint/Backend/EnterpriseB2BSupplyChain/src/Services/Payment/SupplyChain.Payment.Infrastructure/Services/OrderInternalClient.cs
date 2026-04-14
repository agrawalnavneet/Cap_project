using SupplyChain.SharedInfrastructure.Results;

namespace SupplyChain.Payment.Infrastructure.Services;

using SupplyChain.Payment.Application.Abstractions;

public class OrderInternalClient : IOrderInternalClient
{
    private readonly HttpClient _httpClient;

    public OrderInternalClient(HttpClient httpClient)
        => _httpClient = httpClient;

    public async Task<OrderInvoiceDetailsDto?> GetInvoiceDetailsAsync(Guid orderId, CancellationToken ct)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/internal/orders/{orderId}/invoice-details", ct);
            if (!response.IsSuccessStatusCode)
                return null;

            return await ApiResponseReader.ReadDataAsync<OrderInvoiceDetailsDto>(response.Content, ct);
        }
        catch
        {
            return null;
        }
    }

    public async Task AdvanceToDispatchAsync(Guid orderId, CancellationToken ct)
    {
        try
        {
            await _httpClient.PutAsync($"/api/internal/orders/{orderId}/advance-to-dispatch", null, ct);
        }
        catch
        {
            // Best effort
        }
    }
}
