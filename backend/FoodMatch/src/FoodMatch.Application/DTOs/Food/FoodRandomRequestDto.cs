using System.ComponentModel.DataAnnotations;

namespace FoodMatch.Application.DTOs.Food;

public class FoodRandomRequestDto
{
    [MaxLength(20)]
    public string? Category { get; set; } // "Kho" or "Nuoc"
    
    [Required(ErrorMessage = "SessionId is required.")]
    public string SessionId { get; set; } = string.Empty; // To prevent duplicates in the same session
}
