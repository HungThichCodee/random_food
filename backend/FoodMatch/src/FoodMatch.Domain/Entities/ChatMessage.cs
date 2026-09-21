namespace FoodMatch.Domain.Entities;

/// <summary>
/// Chat message between two matched users.
/// Maps to the 'chat_messages' table.
/// </summary>
public class ChatMessage
{
    public int Id { get; set; }
    public int MatchRequestId { get; set; }
    public MatchRequest MatchRequest { get; set; } = null!;
    public Guid SenderTempUserId { get; set; }
    public TempUser SenderTempUser { get; set; } = null!;
    public string Message { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
