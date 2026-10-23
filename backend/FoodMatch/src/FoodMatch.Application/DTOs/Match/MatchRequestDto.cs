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

    public bool HasSharedLocation { get; set; } // Did the current user share?
    public bool BuddyHasSharedLocation { get; set; } // Did the buddy share?
    public DateTime? LocationSharedAt { get; set; }
    
    // Populated when the buddy's own sharing consent is active.
    public double? BuddyLat { get; set; }
    public double? BuddyLng { get; set; }
    public MeetingPlaceChoiceDto? MeetingPlace { get; set; }
}
