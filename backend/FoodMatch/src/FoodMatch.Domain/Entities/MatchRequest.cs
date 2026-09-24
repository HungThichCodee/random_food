using FoodMatch.Domain.Enums;

namespace FoodMatch.Domain.Entities;

/// <summary>
/// A dining match request from one user to another.
/// Maps to the 'match_requests' table.
/// </summary>
public class MatchRequest
{
    public int Id { get; set; }
    public Guid FromTempUserId { get; set; }
    public TempUser FromTempUser { get; set; } = null!;
    public Guid ToTempUserId { get; set; }
    public TempUser ToTempUser { get; set; } = null!;
    public MatchStatus Status { get; set; } = MatchStatus.Pending;  // pending / accepted / declined / expired
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}
