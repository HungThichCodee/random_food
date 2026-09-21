using FoodMatch.Application.DTOs.Restaurant;
using FoodMatch.Application.Interfaces;

namespace FoodMatch.Infrastructure.ExternalApis;

/// <summary>
/// Calls Overpass API (OpenStreetMap) to search for restaurants.
/// </summary>
public class OverpassApiService : IOverpassApiService
{
    private readonly HttpClient _httpClient;

    public OverpassApiService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    // TODO: Implement Overpass API query
    public Task<List<RestaurantDto>> SearchRestaurantsAsync(double lat, double lng, double radiusMeters)
        => throw new NotImplementedException();
}
