namespace FoodMatch.Application.DTOs.Chat;

/// <summary>
/// DTO for sending a chat message to a matched dining partner.
/// </summary>
public class SendMessageDto
{
    public int MatchRequestId { get; set; }
    public string Message { get; set; } = string.Empty;
}
