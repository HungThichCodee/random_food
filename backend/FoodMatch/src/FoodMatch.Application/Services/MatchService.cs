namespace FoodMatch.Application.Services;

using FoodMatch.Application.DTOs.Match;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;
using System.Text.Json;

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

        return await MapToDtoAsync(matchRequest, fromUserId);
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

        // We assume the responder is the ToUserId
        return await MapToDtoAsync(matchRequest, matchRequest.ToTempUserId);
    }

    public async Task<List<MatchRequestDto>> GetPendingRequestsAsync(Guid userId)
    {
        var pendingRequests = await matchRequestRepository.FindAsync(m => 
            m.ToTempUserId == userId && 
            m.Status == FoodMatch.Domain.Enums.MatchStatus.Pending);

        var result = new List<MatchRequestDto>();
        foreach (var req in pendingRequests)
        {
            result.Add(await MapToDtoAsync(req, userId));
        }
        return result;
    }

    public async Task<MatchRequestDto?> GetActiveMatchAsync(Guid userId)
    {
        var activeMatch = (await matchRequestRepository.FindAsync(m => 
            (m.FromTempUserId == userId || m.ToTempUserId == userId) && 
            m.Status == FoodMatch.Domain.Enums.MatchStatus.Accepted)).FirstOrDefault();

        if (activeMatch == null) return null;

        return await MapToDtoAsync(activeMatch, userId);
    }

    public async Task<MatchRequestDto> ShareLocationAsync(int requestId, Guid userId)
    {
        var matchRequest = await matchRequestRepository.GetByIdAsync(requestId);
        if (matchRequest == null)
            throw new KeyNotFoundException("Match request not found.");

        if (matchRequest.Status != FoodMatch.Domain.Enums.MatchStatus.Accepted)
            throw new UnauthorizedAccessException("You can only share location for accepted matches.");

        if (matchRequest.FromTempUserId == userId)
            matchRequest.FromUserSharedLocation = true;
        else if (matchRequest.ToTempUserId == userId)
            matchRequest.ToUserSharedLocation = true;
        else
            throw new UnauthorizedAccessException("You are not part of this match.");

        if (matchRequest.FromUserSharedLocation && matchRequest.ToUserSharedLocation)
        {
            matchRequest.LocationSharedAt = DateTime.UtcNow;
        }

        await matchRequestRepository.UpdateAsync(matchRequest);
        return await MapToDtoAsync(matchRequest, userId);
    }

    public async Task<MatchRequestDto> StopSharingLocationAsync(int requestId, Guid userId)
    {
        var matchRequest = await matchRequestRepository.GetByIdAsync(requestId);
        if (matchRequest == null)
            throw new KeyNotFoundException("Match request not found.");

        if (matchRequest.FromTempUserId == userId)
            matchRequest.FromUserSharedLocation = false;
        else if (matchRequest.ToTempUserId == userId)
            matchRequest.ToUserSharedLocation = false;
        else
            throw new UnauthorizedAccessException("You are not part of this match.");

        matchRequest.LocationSharedAt = null;

        await matchRequestRepository.UpdateAsync(matchRequest);
        return await MapToDtoAsync(matchRequest, userId);
    }

    private async Task<MatchRequestDto> MapToDtoAsync(MatchRequest req, Guid currentUserId)
    {
        var fromUser = await tempUserRepository.GetByIdAsync(req.FromTempUserId);
        var toUser = await tempUserRepository.GetByIdAsync(req.ToTempUserId);

        var dto = new MatchRequestDto
        {
            Id = req.Id,
            FromUserId = req.FromTempUserId,
            FromUserName = fromUser?.DisplayName ?? "Unknown",
            ToUserId = req.ToTempUserId,
            ToUserName = toUser?.DisplayName ?? "Unknown",
            Status = req.Status.ToString(),
            CreatedAt = req.CreatedAt,
            LocationSharedAt = req.LocationSharedAt,
            HasSharedLocation = (req.FromTempUserId == currentUserId && req.FromUserSharedLocation) ||
                                (req.ToTempUserId == currentUserId && req.ToUserSharedLocation),
            BuddyHasSharedLocation = (req.FromTempUserId != currentUserId && req.FromUserSharedLocation) ||
                                     (req.ToTempUserId != currentUserId && req.ToUserSharedLocation)
        };

        // If mutual share is active AND location sharing hasn't expired (e.g. 60 min limit)
        bool isMutual = req.FromUserSharedLocation && req.ToUserSharedLocation;
        bool isNotExpired = req.LocationSharedAt.HasValue && (DateTime.UtcNow - req.LocationSharedAt.Value).TotalMinutes < 60;

        if (isMutual && isNotExpired)
        {
            // The buddy is the one who is NOT the current user
            var buddyId = req.FromTempUserId == currentUserId ? req.ToTempUserId : req.FromTempUserId;
            var buddy = buddyId == req.FromTempUserId ? fromUser : toUser;

            if (buddy != null)
            {
                dto.BuddyLat = buddy.CurrentLat;
                dto.BuddyLng = buddy.CurrentLng;
            }
        }
        else if (isMutual && !isNotExpired)
        {
            // Auto-expire
            req.FromUserSharedLocation = false;
            req.ToUserSharedLocation = false;
            req.LocationSharedAt = null;
            await matchRequestRepository.UpdateAsync(req);
            
            dto.HasSharedLocation = false;
            dto.BuddyHasSharedLocation = false;
        }

        return dto;
    }
}
