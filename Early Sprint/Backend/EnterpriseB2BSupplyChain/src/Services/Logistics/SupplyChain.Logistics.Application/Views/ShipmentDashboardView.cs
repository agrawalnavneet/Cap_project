using SupplyChain.Logistics.Application.DTOs;

namespace SupplyChain.Logistics.Application.Views;

public record ShipmentDashboardView(
    Guid ShipmentId,
    Guid OrderId,
    string Status,
    string? AgentName,
    string? AgentPhone,
    string? VehicleRegistrationNo,
    DateTime SlaDeadlineUtc,
    bool SlaAtRisk,
    DateTime? PickedUpAt,
    DateTime? DeliveredAt,
    string? DealerName = null,
    string? ShippingCity = null,
    string? ShippingState = null
)
{
    public static ShipmentDashboardView FromDto(ShipmentDto dto) =>
        new(
            dto.ShipmentId,
            dto.OrderId,
            dto.Status,
            dto.AgentName,
            dto.AgentPhone,
            dto.VehicleRegistrationNo,
            dto.SlaDeadlineUtc,
            dto.SlaAtRisk,
            dto.PickedUpAt,
            dto.DeliveredAt,
            dto.DealerName,
            dto.ShippingCity,
            dto.ShippingState
        );
}

