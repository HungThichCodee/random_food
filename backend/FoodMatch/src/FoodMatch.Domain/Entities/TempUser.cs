namespace FoodMatch.Domain.Entities;

/// <summary>
/// Temporary user profile (no registration required).
/// Auto-expires after 3 hours of inactivity.
/// Maps to the 'temp_users' table.
/// </summary>
public class TempUser
{
    public Guid Id { get; set; }
    public string SessionToken { get; set; } = string.Empty;  // For identifying requests
    public string DisplayName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public string? FoodPreferencesJson { get; set; }  // JSON array of preference tags
    public string? DesiredFood { get; set; }
    public double? CurrentLat { get; set; }
    public double? CurrentLng { get; set; }
    public bool LocationVisible { get; set; }
    public string Status { get; set; } = "available";  // available / matched / hidden
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }

    // Navigation
    public ICollection<MatchRequest> SentMatchRequests { get; set; } = new List<MatchRequest>();
    public ICollection<MatchRequest> ReceivedMatchRequests { get; set; } = new List<MatchRequest>();
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
    public ICollection<FoodSuggestionLog> SuggestionLogs { get; set; } = new List<FoodSuggestionLog>();
}
