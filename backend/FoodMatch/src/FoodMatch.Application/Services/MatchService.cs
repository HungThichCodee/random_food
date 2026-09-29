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
    public async Task<MatchRequestDto> SendMatchRequestAsync(Guid fromUserId, CreateMatchRequestDto dto)
    {
        var fromUser = await tempUserRepository.GetByIdAsync(fromUserId);
        var toUser = await tempUserRepository.GetByIdAsync(dto.ToTempUserId);

        if (fromUser == null || toUser == null)
            throw new ArgumentException("User not found.");

        if (fromUserId == dto.ToTempUserId)
            throw new ArgumentException("Cannot match with yourself.");

        var existingPending = await matchRequestRepository.FindAsync(m => 
            m.FromTempUserId == fromUserId && 
            m.ToTempUserId == dto.ToTempUserId && 
            m.Status == FoodMatch.Domain.Enums.MatchStatus.Pending);

        if (existingPending.Any())
            throw new ArgumentException("A pending request already exists.");

        var matchRequest = new MatchRequest
        {
            FromTempUserId = fromUserId,
            ToTempUserId = dto.ToTempUserId,
            Status = FoodMatch.Domain.Enums.MatchStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await matchRequestRepository.AddAsync(matchRequest);

        return new MatchRequestDto
        {
            Id = matchRequest.Id,
            FromUserId = matchRequest.FromTempUserId,
            FromUserName = fromUser.DisplayName,
            ToUserId = matchRequest.ToTempUserId,
            ToUserName = toUser.DisplayName,
            Status = matchRequest.Status.ToString(),
            CreatedAt = matchRequest.CreatedAt
        };
    }

    public async Task<MatchRequestDto> RespondToRequestAsync(int requestId, bool accept)
    {
        var matchRequest = await matchRequestRepository.GetByIdAsync(requestId);
        if (matchRequest == null)
            throw new KeyNotFoundException("Match request not found.");

        if (matchRequest.Status != FoodMatch.Domain.Enums.MatchStatus.Pending)
            throw new ArgumentException("Match request is no longer pending.");

        matchRequest.Status = accept ? FoodMatch.Domain.Enums.MatchStatus.Accepted : FoodMatch.Domain.Enums.MatchStatus.Declined;
        await matchRequestRepository.UpdateAsync(matchRequest);

        // Fetch users to populate DTO
        var fromUser = await tempUserRepository.GetByIdAsync(matchRequest.FromTempUserId);
        var toUser = await tempUserRepository.GetByIdAsync(matchRequest.ToTempUserId);

        return new MatchRequestDto
        {
            Id = matchRequest.Id,
            FromUserId = matchRequest.FromTempUserId,
            FromUserName = fromUser?.DisplayName ?? "Unknown",
            ToUserId = matchRequest.ToTempUserId,
            ToUserName = toUser?.DisplayName ?? "Unknown",
            Status = matchRequest.Status.ToString(),
            CreatedAt = matchRequest.CreatedAt
        };
    }

    public async Task<List<MatchRequestDto>> GetPendingRequestsAsync(Guid userId)
    {
        // Get requests sent TO this user that are pending
        var pendingRequests = await matchRequestRepository.FindAsync(m => 
            m.ToTempUserId == userId && 
            m.Status == FoodMatch.Domain.Enums.MatchStatus.Pending);

        var result = new List<MatchRequestDto>();
        foreach (var req in pendingRequests)
        {
            var fromUser = await tempUserRepository.GetByIdAsync(req.FromTempUserId);
            var toUser = await tempUserRepository.GetByIdAsync(req.ToTempUserId);
            
            result.Add(new MatchRequestDto
            {
                Id = req.Id,
                FromUserId = req.FromTempUserId,
                FromUserName = fromUser?.DisplayName ?? "Unknown",
                ToUserId = req.ToTempUserId,
                ToUserName = toUser?.DisplayName ?? "Unknown",
                Status = req.Status.ToString(),
                CreatedAt = req.CreatedAt
            });
        }
        return result;
    }

    public async Task<MatchRequestDto?> GetActiveMatchAsync(Guid userId)
    {
        var activeMatch = (await matchRequestRepository.FindAsync(m => 
            (m.FromTempUserId == userId || m.ToTempUserId == userId) && 
            m.Status == FoodMatch.Domain.Enums.MatchStatus.Accepted)).FirstOrDefault();

        if (activeMatch == null) return null;

        var fromUser = await tempUserRepository.GetByIdAsync(activeMatch.FromTempUserId);
        var toUser = await tempUserRepository.GetByIdAsync(activeMatch.ToTempUserId);

        return new MatchRequestDto
        {
            Id = activeMatch.Id,
            FromUserId = activeMatch.FromTempUserId,
            FromUserName = fromUser?.DisplayName ?? "Unknown",
            ToUserId = activeMatch.ToTempUserId,
            ToUserName = toUser?.DisplayName ?? "Unknown",
            Status = activeMatch.Status.ToString(),
            CreatedAt = activeMatch.CreatedAt
        };
    }
}
