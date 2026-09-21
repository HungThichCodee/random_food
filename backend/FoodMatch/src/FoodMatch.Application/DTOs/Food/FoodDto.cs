namespace FoodMatch.Application.DTOs.Food;

/// <summary>
/// Data transfer object for food item information.
/// </summary>
public class FoodDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? CuisineType { get; set; }
    public string? ImageUrl { get; set; }
    public string? AvgPriceRange { get; set; }
    public string? MealTime { get; set; }
    public List<string> Tags { get; set; } = new();
}
