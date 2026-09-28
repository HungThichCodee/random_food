using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace FoodMatch.Application.DTOs.TempUser;

/// <summary>
/// DTO for creating a new temporary user profile.
/// </summary>
public class CreateTempUserDto
{
    [Required(ErrorMessage = "DisplayName is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "DisplayName must be between 2 and 100 characters.")]
    public string DisplayName { get; set; } = string.Empty;

    [StringLength(20, ErrorMessage = "Gender must not exceed 20 characters.")]
    public string? Gender { get; set; }

    public List<string>? FoodPreferences { get; set; }

    [StringLength(100, ErrorMessage = "DesiredFood must not exceed 100 characters.")]
    public string? DesiredFood { get; set; }
}
