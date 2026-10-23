using System.ComponentModel.DataAnnotations;

namespace FoodMatch.Application.DTOs.Food;

public class FoodRandomRequestDto
{
    [MaxLength(20)]
    public string? Category { get; set; } // "Kho" or "Nuoc"
    
    [Required(ErrorMessage = "SessionId is required.")]
    [MaxLength(64)]
    public string SessionId { get; set; } = string.Empty; // Client session reference, not a user identity.
}
