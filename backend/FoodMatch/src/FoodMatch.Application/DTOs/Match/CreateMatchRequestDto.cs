namespace FoodMatch.Application.DTOs.Match;

/// <summary>
/// DTO for initiating a dining match request with another temporary user.
/// </summary>
public class CreateMatchRequestDto
{
    public Guid ToTempUserId { get; set; }
}
