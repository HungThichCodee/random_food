namespace FoodMatch.Domain.Entities;

/// <summary>
/// Food tag for categorization (e.g., spicy, vegetarian, healthy).
/// Maps to the 'food_tags' table.
/// </summary>
public class FoodTag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // Navigation
    public ICollection<FoodFoodTag> FoodFoodTags { get; set; } = new List<FoodFoodTag>();
}
