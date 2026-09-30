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

        private static readonly string[] Endpoints = new[]
        {
            "https://overpass-api.de/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter"
        };

        public async Task<List<Restaurant>> FetchNearbyRestaurantsAsync(double latitude, double longitude, double radius)
        {
            string query = $@"
                [out:json][timeout:15];
                (
                  node[""amenity""=""restaurant""](around:{radius},{latitude},{longitude});
                  node[""amenity""=""cafe""](around:{radius},{latitude},{longitude});
                  node[""amenity""=""food_court""](around:{radius},{latitude},{longitude});
                );
                out body;
            ";

            foreach (var endpoint in Endpoints)
            {
                try
                {
                    _logger.LogInformation($"Trying Overpass API endpoint: {endpoint}");
                    var content = new FormUrlEncodedContent(new[]
                    {
                        new KeyValuePair<string, string>("data", query)
                    });

                    var requestMessage = new HttpRequestMessage(HttpMethod.Post, endpoint) { Content = content };
                    // Reset BaseAddress effect by using absolute URI
                    
                    var response = await _httpClient.SendAsync(requestMessage);
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
                            if (name == "Unknown Restaurant") continue; // Skip unnamed
                            string address = tags.TryGetProperty("addr:street", out var streetProp) ? streetProp.GetString() ?? "" : "";
                            
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

                    _logger.LogInformation($"Successfully fetched {results.Count} restaurants from {endpoint}");
                    return results;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Failed to fetch from Overpass API endpoint: {endpoint}");
                    // Continue to next endpoint
                }
            }

            _logger.LogError("All Overpass API endpoints failed. Returning empty list to prevent crash.");
            return new List<Restaurant>();
        }
    }
}
