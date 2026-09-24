using FoodMatch.Domain.Enums;

namespace FoodMatch.Domain.Entities;

/// <summary>
/// Represents a food item in the system.
/// Maps to the 'foods' table.
/// </summary>
public class Food
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public FoodCategory? Category { get; set; }
    public string? CuisineType { get; set; }
    public string? ImageUrl { get; set; }
    public PriceRange? AvgPriceRange { get; set; }
    public MealTime? MealTime { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<FoodFoodTag> FoodFoodTags { get; set; } = new List<FoodFoodTag>();
    public ICollection<FoodSuggestionLog> SuggestionLogs { get; set; } = new List<FoodSuggestionLog>();
}
