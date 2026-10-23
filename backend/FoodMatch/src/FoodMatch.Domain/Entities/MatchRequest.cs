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

    // Location sharing state
    public bool FromUserSharedLocation { get; set; }
    public bool ToUserSharedLocation { get; set; }
    public DateTime? FromUserSharedAt { get; set; }
    public DateTime? ToUserSharedAt { get; set; }
    public DateTime? LocationSharedAt { get; set; }

    // A meeting place proposed by one participant and confirmed by the other.
    public string? MeetingPlaceId { get; set; }
    public string? MeetingPlaceName { get; set; }
    public string? MeetingPlaceCategory { get; set; }
    public double? MeetingPlaceLat { get; set; }
    public double? MeetingPlaceLng { get; set; }
    public string? MeetingPlaceGoogleMapsUrl { get; set; }
    public Guid? MeetingPlaceProposedBy { get; set; }
    public DateTime? MeetingPlaceAgreedAt { get; set; }
    public uint Version { get; set; }

    // Navigation
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}
