namespace FoodMatch.Application.DTOs.TempUser;

/// <summary>
/// DTO for creating a new temporary user profile.
/// </summary>
public class CreateTempUserDto
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public List<string>? FoodPreferences { get; set; }
    public string? DesiredFood { get; set; }
}
