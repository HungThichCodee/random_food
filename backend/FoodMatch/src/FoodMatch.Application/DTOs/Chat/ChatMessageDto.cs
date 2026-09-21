namespace FoodMatch.Application.DTOs.Chat;

/// <summary>
/// Data transfer object for chat message details.
/// </summary>
public class ChatMessageDto
{
    public int Id { get; set; }
    public Guid SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
}
