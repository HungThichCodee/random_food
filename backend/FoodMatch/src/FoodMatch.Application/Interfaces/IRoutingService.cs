using FoodMatch.Application.DTOs.Routing;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for route calculation and polyline generation.
/// </summary>
public interface IRoutingService
{
    Task<RouteDto?> GetRouteAsync(double fromLat, double fromLng, double toLat, double toLng);
}
