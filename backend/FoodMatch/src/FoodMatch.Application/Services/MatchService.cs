namespace FoodMatch.Application.Services;

using FoodMatch.Application.DTOs.Match;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;

/// <summary>
/// Service implementation for social dining matching requests and responses.
/// </summary>
public class MatchService(
    IRepository<MatchRequest> matchRequestRepository,
    IRepository<TempUser> tempUserRepository) : IMatchService
{
    public Task<MatchRequestDto> SendMatchRequestAsync(Guid fromUserId, CreateMatchRequestDto dto)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 4
    }

    public Task<MatchRequestDto> RespondToRequestAsync(int requestId, bool accept)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 4
    }

    public Task<List<MatchRequestDto>> GetPendingRequestsAsync(Guid userId)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 4
    }

    public Task<MatchRequestDto?> GetActiveMatchAsync(Guid userId)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 4
    }
}
