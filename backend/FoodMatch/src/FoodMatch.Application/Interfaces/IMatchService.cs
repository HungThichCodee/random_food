using FoodMatch.Application.DTOs.Match;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for social dining matching workflows.
/// </summary>
public interface IMatchService
{
    Task<MatchRequestDto> SendMatchRequestAsync(Guid fromUserId, CreateMatchRequestDto dto);
    Task<MatchRequestDto> RespondToRequestAsync(int requestId, bool accept);
    Task<List<MatchRequestDto>> GetPendingRequestsAsync(Guid userId);
    Task<MatchRequestDto?> GetActiveMatchAsync(Guid userId);
}
