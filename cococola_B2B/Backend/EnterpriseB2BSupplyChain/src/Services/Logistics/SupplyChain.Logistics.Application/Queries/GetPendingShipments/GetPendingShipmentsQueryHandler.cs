using MediatR;
using SupplyChain.Logistics.Application.Abstractions;
using SupplyChain.Logistics.Application.DTOs;

namespace SupplyChain.Logistics.Application.Queries.GetPendingShipments;

public class GetPendingShipmentsQueryHandler : IRequestHandler<GetPendingShipmentsQuery, List<ShipmentDto>>
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly IOrderServiceClient _orderServiceClient;

    public GetPendingShipmentsQueryHandler(IShipmentRepository shipmentRepository, IOrderServiceClient orderServiceClient)
    {
        _shipmentRepository = shipmentRepository;
        _orderServiceClient = orderServiceClient;
    }

    public async Task<List<ShipmentDto>> Handle(GetPendingShipmentsQuery query, CancellationToken ct)
    {
        var shipments = await _shipmentRepository.GetAllActiveAsync(ct);

        var dtos = new List<ShipmentDto>();

        foreach (var s in shipments)
        {
            var notificationDetails = await _orderServiceClient.GetOrderNotificationDetailsAsync(s.OrderId, ct);

            dtos.Add(new ShipmentDto(
                ShipmentId:           s.ShipmentId,
                OrderId:              s.OrderId,
                Status:               s.Status.ToString(),
                AgentName:            s.Agent?.FullName,
                AgentPhone:           s.Agent?.Phone,
                VehicleRegistrationNo:s.Vehicle?.RegistrationNo,
                SlaDeadlineUtc:       s.SlaDeadlineUtc,
                SlaAtRisk:            s.IsSlaAtRisk(),
                PickedUpAt:           s.PickedUpAt,
                DeliveredAt:          s.DeliveredAt,
                DealerName:           notificationDetails?.DealerName,
                ShippingCity:         notificationDetails?.ShippingCity,
                ShippingState:        notificationDetails?.ShippingState
            ));
        }

        return dtos;
    }
}
