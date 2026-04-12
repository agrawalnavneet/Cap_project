using System.Text.Json;

namespace SupplyChain.SharedInfrastructure.Results;

/// <summary>
/// Helper for reading typed data from API response HTTP content using the standard
/// { success, data, message } response envelope format.
/// </summary>
public static class ApiResponseReader
{
    private record ApiEnvelope<T>(bool Success, T? Data, string? Message);

    /// <summary>
    /// Deserializes the HTTP response content and returns the typed data payload.
    /// Returns <c>null</c> if the response is not successful or deserialization fails.
    /// </summary>
    public static async Task<T?> ReadDataAsync<T>(HttpContent content, CancellationToken ct = default)
    {
        try
        {
            var json = await content.ReadAsStringAsync(ct);
            var envelope = JsonSerializer.Deserialize<ApiEnvelope<T>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            return envelope is { Success: true } ? envelope.Data : default;
        }
        catch
        {
            return default;
        }
    }
}
