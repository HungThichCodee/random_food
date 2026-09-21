namespace FoodMatch.Application.DTOs.Food;

/// <summary>
/// Criteria parameters for filtering and suggesting food items.
/// </summary>
public class FoodCriteriaDto
{
    public string? Category { get; set; }              // kho / nuoc
    public List<string>? Tags { get; set; }             // cay, chay, healthy...
    public string? PriceRange { get; set; }             // re / vua / cao
    public string? MealTime { get; set; }               // sang / trua / toi / khuya
    public List<int>? ExcludeFoodIds { get; set; }      // IDs to exclude (avoid repetition)
}
