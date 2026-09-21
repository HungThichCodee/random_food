using FoodMatch.Application.DTOs.Restaurant;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for restaurant queries and geographic location searches.
/// </summary>
public interface IRestaurantService
{
    Task<List<RestaurantDto>> GetNearbyRestaurantsAsync(double lat, double lng, double radiusKm = 3.0);
    Task<List<RestaurantDto>> GetBuffetInMallAsync(double lat, double lng);
    Task<RestaurantDto?> GetRandomNearbyRestaurantAsync(double lat, double lng, double radiusKm = 3.0);
}
