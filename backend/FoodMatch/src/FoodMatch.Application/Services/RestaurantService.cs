using FoodMatch.Application.DTOs.Restaurant;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoodMatch.Application.Services
{
    public class RestaurantService : IRestaurantService
    {
        private readonly IRepository<Restaurant> _restaurantRepository;
        private readonly IOverpassApiService _overpassApiService;
        private readonly ILogger<RestaurantService> _logger;

        public RestaurantService(
            IRepository<Restaurant> restaurantRepository,
            IOverpassApiService overpassApiService,
            ILogger<RestaurantService> logger)
        {
            _restaurantRepository = restaurantRepository;
            _overpassApiService = overpassApiService;
            _logger = logger;
        }

        public async Task<List<RestaurantResponseDto>> GetNearbyAsync(NearbyRequestDto request)
        {
            try
            {
                // Guard clause
                if (request.Radius < 100 || request.Radius > 5000)
                {
                    throw new ApplicationException("Radius must be between 100 and 5000 meters");
                }

                // Check DB first
                var allRestaurants = await _restaurantRepository.GetAllAsync();
                
                var nearbyDb = allRestaurants
                    .Select(r => new { Restaurant = r, Distance = CalculateDistance(request.Latitude, request.Longitude, r.Lat, r.Lng) })
                    .Where(x => x.Distance <= request.Radius)
                    .OrderBy(x => x.Distance)
                    .ToList();

                if (nearbyDb.Any())
                {
                    _logger.LogInformation("Returning {Count} restaurants from database.", nearbyDb.Count);
                    return nearbyDb.Select(x => MapToDto(x.Restaurant, x.Distance)).ToList();
                }

                // Fallback to Overpass API
                _logger.LogInformation("No restaurants found in DB, querying Overpass API.");
                var overpassRestaurants = await _overpassApiService.FetchNearbyRestaurantsAsync(request.Latitude, request.Longitude, request.Radius);

                // Cache them in DB
                foreach (var r in overpassRestaurants)
                {
                    // Check if exists to avoid duplicates
                    var existing = allRestaurants.FirstOrDefault(x => x.Lat == r.Lat && x.Lng == r.Lng);
                    if (existing == null)
                    {
                        await _restaurantRepository.AddAsync(r);
                    }
                }

                var nearbyApi = overpassRestaurants
                    .Select(r => new { Restaurant = r, Distance = CalculateDistance(request.Latitude, request.Longitude, r.Lat, r.Lng) })
                    .Where(x => x.Distance <= request.Radius)
                    .OrderBy(x => x.Distance)
                    .ToList();

                return nearbyApi.Select(x => MapToDto(x.Restaurant, x.Distance)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting nearby restaurants.");
                throw new ApplicationException($"Error getting nearby restaurants: {ex.Message}", ex);
            }
        }

        public async Task<List<RestaurantResponseDto>> GetBuffetInMallAsync(NearbyRequestDto request)
        {
            try
            {
                var allNearby = await GetNearbyAsync(request);
                return allNearby.Where(r => r.IsBuffet || r.IsInMall).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting buffet/mall restaurants.");
                throw new ApplicationException($"Error getting buffet/mall restaurants: {ex.Message}", ex);
            }
        }

        private static RestaurantResponseDto MapToDto(Restaurant r, double distance)
        {
            return new RestaurantResponseDto
            {
                Id = r.Id,
                Name = r.Name,
                Address = r.Address ?? string.Empty,
                Latitude = r.Lat,
                Longitude = r.Lng,
                GoogleMapUrl = $"https://www.google.com/maps/search/?api=1&query={r.Lat},{r.Lng}",
                Rating = 0, // Not available from OSM
                Distance = distance,
                IsBuffet = r.IsBuffet,
                IsInMall = r.IsInMall
            };
        }

        // Haversine formula
        private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var r = 6371000; // Earth radius in meters
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return r * c;
        }

        private static double ToRadians(double angle)
        {
            return Math.PI * angle / 180.0;
        }
    }
}
