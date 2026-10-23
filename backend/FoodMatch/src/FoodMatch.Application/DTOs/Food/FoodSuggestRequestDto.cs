using System.ComponentModel.DataAnnotations;

namespace FoodMatch.Application.DTOs.Food;

public class FoodSuggestRequestDto
{
    [Required(ErrorMessage = "SessionId is required.")]
    [MaxLength(64)]
    public string SessionId { get; set; } = string.Empty;
    
    [MaxLength(4)]
    public List<string>? MealTimes { get; set; }
    
    [MaxLength(20)]
    public string? PriceRange { get; set; }
    
    [MaxLength(50)]
    public string? Category { get; set; }
    
    [MaxLength(20)]
    public List<string>? IncludedTags { get; set; }
    [MaxLength(20)]
    public List<string>? ExcludedTags { get; set; }
}
