namespace FoodMatch.Application.DTOs.Restaurant;

/// <summary>
/// Data transfer object for restaurant details and location.
/// </summary>
public class RestaurantDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string? Category { get; set; }
    public bool IsBuffet { get; set; }
    public bool IsInMall { get; set; }
    public string? MallName { get; set; }
}
