using System.ComponentModel.DataAnnotations;

namespace FoodMatch.Application.DTOs.Food;

public class FoodSuggestRequestDto
{
    [Required(ErrorMessage = "SessionId is required to prevent duplicate suggestions.")]
    public string SessionId { get; set; } = string.Empty;
    
    public List<string>? MealTimes { get; set; }
    
    [MaxLength(20)]
    public string? PriceRange { get; set; }
    
    [MaxLength(50)]
    public string? Category { get; set; }
    
    public List<string>? IncludedTags { get; set; }
    public List<string>? ExcludedTags { get; set; }
}
