namespace FoodMatch.Domain.Entities;

/// <summary>
/// Join table between Food and FoodTag (many-to-many).
/// Maps to the 'food_food_tags' table.
/// </summary>
public class FoodFoodTag
{
    public int FoodId { get; set; }
    public Food Food { get; set; } = null!;

    public int TagId { get; set; }
    public FoodTag Tag { get; set; } = null!;
}
