namespace FoodMatch.Application.DTOs.Food;

public class FoodResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string CuisineType { get; set; } = string.Empty;
    public string AvgPriceRange { get; set; } = string.Empty;
    public string MealTime { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
}
