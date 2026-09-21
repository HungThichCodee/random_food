using FoodMatch.Application.DTOs.Routing;
using FoodMatch.Application.Interfaces;

namespace FoodMatch.Infrastructure.ExternalApis;

/// <summary>
/// Calls OSRM (Open Source Routing Machine) for route directions.
/// Uses public demo server: https://router.project-osrm.org
/// </summary>
public class OsrmRoutingService : IRoutingService
{
    private readonly HttpClient _httpClient;

    public OsrmRoutingService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    // TODO: Implement OSRM routing API call
    public Task<RouteDto?> GetRouteAsync(double fromLat, double fromLng, double toLat, double toLng)
        => throw new NotImplementedException();
}
