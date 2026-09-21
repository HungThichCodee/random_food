namespace FoodMatch.Application.DTOs.TempUser;

/// <summary>
/// Data transfer object for temporary user profile and session data.
/// </summary>
public class TempUserDto
{
    public Guid Id { get; set; }
    public string SessionToken { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public List<string> FoodPreferences { get; set; } = new();
    public string? DesiredFood { get; set; }
    public double? CurrentLat { get; set; }
    public double? CurrentLng { get; set; }
    public bool LocationVisible { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
