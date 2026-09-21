using FoodMatch.Application.DTOs.Restaurant;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for querying OpenStreetMap via Overpass API.
/// </summary>
public interface IOverpassApiService
{
    Task<List<RestaurantDto>> SearchRestaurantsAsync(double lat, double lng, double radiusMeters);
}
