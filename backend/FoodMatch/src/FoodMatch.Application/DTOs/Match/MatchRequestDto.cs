namespace FoodMatch.Application.DTOs.Match;

/// <summary>
/// Data transfer object representing a social dining match request.
/// </summary>
public class MatchRequestDto
{
    public int Id { get; set; }
    public Guid FromUserId { get; set; }
    public string FromUserName { get; set; } = string.Empty;
    public Guid ToUserId { get; set; }
    public string ToUserName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
