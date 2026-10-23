using FoodMatch.Application.DTOs.Match;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for social dining matching workflows.
/// </summary>
public interface IMatchService
{
    Task<MatchRequestDto> SendMatchRequestAsync(Guid fromUserId, CreateMatchRequestDto dto);
    Task<MatchRequestDto> RespondToRequestAsync(int requestId, Guid responderUserId, bool accept);
    Task<MatchRequestDto> GetMatchForUserAsync(int requestId, Guid userId);
    Task<List<MatchRequestDto>> GetPendingRequestsAsync(Guid userId);
    Task<MatchRequestDto?> GetActiveMatchAsync(Guid userId);
    Task<MatchRequestDto> ShareLocationAsync(int requestId, Guid userId);
    Task<MatchRequestDto> StopSharingLocationAsync(int requestId, Guid userId);
    Task<MatchRequestDto> ProposeMeetingPlaceAsync(int requestId, Guid userId, MeetingPlaceSelection place);
    Task<MatchRequestDto> ProposeGoogleMeetingPlaceAsync(int requestId, Guid userId,
        ProposeGoogleMeetingPlaceDto place);
    Task<MatchRequestDto> ConfirmMeetingPlaceAsync(int requestId, Guid userId, string expectedPlaceId);
}
