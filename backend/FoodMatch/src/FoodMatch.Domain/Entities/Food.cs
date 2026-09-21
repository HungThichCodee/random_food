namespace FoodMatch.Domain.Entities;

/// <summary>
/// Represents a food item in the system.
/// Maps to the 'foods' table.
/// </summary>
public class Food
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }           // kho / nuoc
    public string? CuisineType { get; set; }
    public string? ImageUrl { get; set; }
    public string? AvgPriceRange { get; set; }       // re / vua / cao
    public string? MealTime { get; set; }             // sang / trua / toi / khuya
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<FoodFoodTag> FoodFoodTags { get; set; } = new List<FoodFoodTag>();
    public ICollection<FoodSuggestionLog> SuggestionLogs { get; set; } = new List<FoodSuggestionLog>();
}
