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

    public async Task<RouteDto?> GetRouteAsync(double fromLat, double fromLng, double toLat, double toLng)
    {
        try
        {
            // OSRM requires coordinates in longitude,latitude order
            var url = $"http://router.project-osrm.org/route/v1/driving/{fromLng.ToString(System.Globalization.CultureInfo.InvariantCulture)},{fromLat.ToString(System.Globalization.CultureInfo.InvariantCulture)};{toLng.ToString(System.Globalization.CultureInfo.InvariantCulture)},{toLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}?overview=full&geometries=geojson";
            
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
                return null;
                
            var json = await response.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            
            var root = doc.RootElement;
            if (root.GetProperty("code").GetString() != "Ok")
                return null;
                
            var route = root.GetProperty("routes")[0];
            var distanceMeter = route.GetProperty("distance").GetDouble();
            var durationSecond = route.GetProperty("duration").GetDouble();
            
            var coordinatesNode = route.GetProperty("geometry").GetProperty("coordinates");
            var coordinates = new List<double[]>();
            
            foreach (var point in coordinatesNode.EnumerateArray())
            {
                coordinates.Add(new double[] 
                { 
                    point[0].GetDouble(), // lng
                    point[1].GetDouble()  // lat
                });
            }
            
            return new RouteDto
            {
                DistanceKm = Math.Round(distanceMeter / 1000.0, 2),
                DurationMinutes = Math.Round(durationSecond / 60.0, 2),
                Coordinates = coordinates
            };
        }
        catch
        {
            return null; // Fallback or handle gracefully
        }
    }
}
