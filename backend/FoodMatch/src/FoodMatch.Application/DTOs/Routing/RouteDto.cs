namespace FoodMatch.Application.DTOs.Routing;

/// <summary>
/// Data transfer object containing routing calculations between two locations.
/// </summary>
public class RouteDto
{
    public double DistanceKm { get; set; }
    public double DurationMinutes { get; set; }
    public List<double[]> Coordinates { get; set; } = new();  // [lng, lat] pairs for polyline
}
