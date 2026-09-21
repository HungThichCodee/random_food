namespace FoodMatch.Domain.Entities;

/// <summary>
/// Cached restaurant data from OpenStreetMap (Overpass API).
/// Maps to the 'restaurants' table.
/// </summary>
public class Restaurant
{
    public int Id { get; set; }
    public string? ExternalPlaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string? Category { get; set; }
    public bool IsBuffet { get; set; }
    public bool IsInMall { get; set; }
    public string? MallName { get; set; }
    public string Source { get; set; } = "osm";
    public DateTime LastSyncedAt { get; set; } = DateTime.UtcNow;
}
