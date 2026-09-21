namespace FoodMatch.Application.Services;

using FoodMatch.Application.DTOs.Restaurant;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;

/// <summary>
/// Service implementation for restaurant search and recommendations.
/// </summary>
public class RestaurantService(
    IRepository<Restaurant> restaurantRepository,
    IOverpassApiService overpassApiService) : IRestaurantService
{
    public Task<List<RestaurantDto>> GetNearbyRestaurantsAsync(double lat, double lng, double radiusKm = 3.0)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 2
    }

    public Task<List<RestaurantDto>> GetBuffetInMallAsync(double lat, double lng)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 2
    }

    public Task<RestaurantDto?> GetRandomNearbyRestaurantAsync(double lat, double lng, double radiusKm = 3.0)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 2
    }
}
