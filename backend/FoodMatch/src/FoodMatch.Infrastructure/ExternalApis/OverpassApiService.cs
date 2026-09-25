using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace FoodMatch.Infrastructure.Services
{
    public class OverpassApiService : IOverpassApiService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<OverpassApiService> _logger;

        public OverpassApiService(HttpClient httpClient, ILogger<OverpassApiService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _httpClient.BaseAddress = new Uri("https://overpass-api.de/api/");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "FoodMatchApp/1.0");
        }

        public async Task<List<Restaurant>> FetchNearbyRestaurantsAsync(double latitude, double longitude, double radius)
        {
            try
            {
                // Query Overpass for amenity=restaurant, cafe, food_court within radius
                string query = $@"
                    [out:json][timeout:25];
                    (
                      node[""amenity""=""restaurant""](around:{radius},{latitude},{longitude});
                      node[""amenity""=""cafe""](around:{radius},{latitude},{longitude});
                      node[""amenity""=""food_court""](around:{radius},{latitude},{longitude});
                    );
                    out body;
                ";

                var content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("data", query)
                });

                var response = await _httpClient.PostAsync("interpreter", content);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                using var document = JsonDocument.Parse(jsonString);

                var results = new List<Restaurant>();
                var elements = document.RootElement.GetProperty("elements");

                foreach (var element in elements.EnumerateArray())
                {
                    var id = element.GetProperty("id").GetInt64();
                    var lat = element.GetProperty("lat").GetDouble();
                    var lon = element.GetProperty("lon").GetDouble();
                    
                    if (element.TryGetProperty("tags", out var tags))
                    {
                        string name = tags.TryGetProperty("name", out var nameProp) ? nameProp.GetString() ?? "Unknown Restaurant" : "Unknown Restaurant";
                        string address = tags.TryGetProperty("addr:street", out var streetProp) ? streetProp.GetString() ?? "" : "";
                        
                        // Heuristics for buffet/mall
                        bool isBuffet = name.Contains("buffet", StringComparison.OrdinalIgnoreCase);
                        bool isInMall = tags.TryGetProperty("indoor", out var indoorProp) && indoorProp.GetString() == "yes";

                        results.Add(new Restaurant
                        {
                            Name = name,
                            Address = address,
                            Lat = lat,
                            Lng = lon,
                            IsBuffet = isBuffet,
                            IsInMall = isInMall
                        });
                    }
                }

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch nearby restaurants from Overpass API.");
                throw new ApplicationException("Error fetching data from Overpass API.", ex);
            }
        }
    }
}
