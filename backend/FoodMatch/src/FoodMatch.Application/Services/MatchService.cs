namespace FoodMatch.Application.Services;

using FoodMatch.Application.DTOs.Match;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using System.Text;

/// <summary>
/// Service implementation for social dining matching requests and responses.
/// </summary>
public class MatchService(
    IRepository<MatchRequest> matchRequestRepository,
    IRepository<TempUser> tempUserRepository) : IMatchService
{
    public async Task<MatchRequestDto> SendMatchRequestAsync(Guid fromUserId, CreateMatchRequestDto dto)
    {
        if (dto == null || dto.ToTempUserId == Guid.Empty)
            throw new ArgumentException("Invalid match target.");
        var fromUser = await tempUserRepository.GetByIdAsync(fromUserId);
        var toUser = await tempUserRepository.GetByIdAsync(dto.ToTempUserId);

        if (fromUser == null || toUser == null ||
            fromUser.ExpiresAt <= DateTime.UtcNow || toUser.ExpiresAt <= DateTime.UtcNow ||
            !toUser.LocationVisible)
            throw new ArgumentException("User not found.");

        if (fromUserId == dto.ToTempUserId)
            throw new ArgumentException("Cannot match with yourself.");

        if (!fromUser.CurrentLat.HasValue || !fromUser.CurrentLng.HasValue ||
            !toUser.CurrentLat.HasValue || !toUser.CurrentLng.HasValue ||
            !NearbyDiscovery.Contains(fromUser.CurrentLat.Value, fromUser.CurrentLng.Value,
                toUser.CurrentLat.Value, toUser.CurrentLng.Value))
            throw new ArgumentException("Target is not currently nearby.");

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

    public async Task<MatchRequestDto> RespondToRequestAsync(int requestId, Guid responderUserId, bool accept)
    {
        var matchRequest = await matchRequestRepository.GetByIdAsync(requestId);
        if (matchRequest == null)
            throw new KeyNotFoundException("Match request not found.");

        if (matchRequest.ToTempUserId != responderUserId)
            throw new UnauthorizedAccessException("Only the invited user can respond.");

        if (matchRequest.Status != FoodMatch.Domain.Enums.MatchStatus.Pending)
            throw new ArgumentException("Match request is no longer pending.");

        var sender = await tempUserRepository.GetByIdAsync(matchRequest.FromTempUserId);
        var recipient = await tempUserRepository.GetByIdAsync(matchRequest.ToTempUserId);
        if (sender?.ExpiresAt <= DateTime.UtcNow || recipient?.ExpiresAt <= DateTime.UtcNow ||
            sender == null || recipient == null)
            throw new ArgumentException("Match request is no longer available.");

        matchRequest.Status = accept ? FoodMatch.Domain.Enums.MatchStatus.Accepted : FoodMatch.Domain.Enums.MatchStatus.Declined;
        await matchRequestRepository.UpdateAsync(matchRequest);

        // We assume the responder is the ToUserId
        return await MapToDtoAsync(matchRequest, responderUserId);
    }

    public async Task<MatchRequestDto> GetMatchForUserAsync(int requestId, Guid userId)
    {
        var match = await matchRequestRepository.GetByIdAsync(requestId)
            ?? throw new KeyNotFoundException("Match request not found.");
        if (match.FromTempUserId != userId && match.ToTempUserId != userId)
            throw new UnauthorizedAccessException("You are not part of this match.");
        if (!await BothProfilesActiveAsync(match))
            throw new KeyNotFoundException("Match request is no longer available.");
        return await MapToDtoAsync(match, userId);
    }

    public async Task<List<MatchRequestDto>> GetPendingRequestsAsync(Guid userId)
    {
        var pendingRequests = await matchRequestRepository.FindAsync(m => 
            m.ToTempUserId == userId && 
            m.Status == FoodMatch.Domain.Enums.MatchStatus.Pending);

        var result = new List<MatchRequestDto>();
        foreach (var req in pendingRequests)
        {
            if (await BothProfilesActiveAsync(req))
                result.Add(await MapToDtoAsync(req, userId));
        }
        return result;
    }

    public async Task<MatchRequestDto?> GetActiveMatchAsync(Guid userId)
    {
        var activeMatches = await matchRequestRepository.FindAsync(m =>
            (m.FromTempUserId == userId || m.ToTempUserId == userId) && 
            m.Status == FoodMatch.Domain.Enums.MatchStatus.Accepted);

        foreach (var match in activeMatches)
            if (await BothProfilesActiveAsync(match))
                return await MapToDtoAsync(match, userId);
        return null;
    }

    private async Task<bool> BothProfilesActiveAsync(MatchRequest match)
    {
        var from = await tempUserRepository.GetByIdAsync(match.FromTempUserId);
        var to = await tempUserRepository.GetByIdAsync(match.ToTempUserId);
        var now = DateTime.UtcNow;
        return from?.ExpiresAt > now && to?.ExpiresAt > now;
    }

    public async Task<MatchRequestDto> ShareLocationAsync(int requestId, Guid userId)
    {
        var matchRequest = await matchRequestRepository.GetByIdAsync(requestId);
        if (matchRequest == null)
            throw new KeyNotFoundException("Match request not found.");

        if (matchRequest.Status != FoodMatch.Domain.Enums.MatchStatus.Accepted)
            throw new UnauthorizedAccessException("You can only share location for accepted matches.");

        if (matchRequest.FromTempUserId != userId && matchRequest.ToTempUserId != userId)
            throw new UnauthorizedAccessException("You are not part of this match.");

        var sharingUser = await tempUserRepository.GetByIdAsync(userId);
        if (sharingUser == null || sharingUser.ExpiresAt <= DateTime.UtcNow ||
            !sharingUser.CurrentLat.HasValue || !sharingUser.CurrentLng.HasValue)
            throw new ArgumentException("Update your location before sharing it.");
        var otherUserId = matchRequest.FromTempUserId == userId
            ? matchRequest.ToTempUserId : matchRequest.FromTempUserId;
        var otherUser = await tempUserRepository.GetByIdAsync(otherUserId);
        if (otherUser == null || otherUser.ExpiresAt <= DateTime.UtcNow)
            throw new ArgumentException("The other profile is no longer active.");

        var now = DateTime.UtcNow;
        ExpireInactiveShares(matchRequest, now);

        if (matchRequest.FromTempUserId == userId)
        {
            matchRequest.FromUserSharedLocation = true;
            matchRequest.FromUserSharedAt = now;
        }
        else
        {
            matchRequest.ToUserSharedLocation = true;
            matchRequest.ToUserSharedAt = now;
        }

        matchRequest.LocationSharedAt =
            IsSharingActive(matchRequest.FromUserSharedLocation, matchRequest.FromUserSharedAt, now) &&
            IsSharingActive(matchRequest.ToUserSharedLocation, matchRequest.ToUserSharedAt, now)
                ? (matchRequest.FromUserSharedAt > matchRequest.ToUserSharedAt
                    ? matchRequest.FromUserSharedAt : matchRequest.ToUserSharedAt)
                : null;

        await matchRequestRepository.UpdateAsync(matchRequest);
        return await MapToDtoAsync(matchRequest, userId);
    }

    public async Task<MatchRequestDto> StopSharingLocationAsync(int requestId, Guid userId)
    {
        var matchRequest = await matchRequestRepository.GetByIdAsync(requestId);
        if (matchRequest == null)
            throw new KeyNotFoundException("Match request not found.");

        if (matchRequest.FromTempUserId == userId)
        {
            matchRequest.FromUserSharedLocation = false;
            matchRequest.FromUserSharedAt = null;
        }
        else if (matchRequest.ToTempUserId == userId)
        {
            matchRequest.ToUserSharedLocation = false;
            matchRequest.ToUserSharedAt = null;
        }
        else
            throw new UnauthorizedAccessException("You are not part of this match.");

        matchRequest.LocationSharedAt = null;
        ClearMeetingPlace(matchRequest);

        await matchRequestRepository.UpdateAsync(matchRequest);
        return await MapToDtoAsync(matchRequest, userId);
    }

    public async Task<MatchRequestDto> ProposeMeetingPlaceAsync(
        int requestId, Guid userId, MeetingPlaceSelection place)
    {
        if (place == null ||
            string.IsNullOrWhiteSpace(place.Id) ||
            !Regex.IsMatch(place.Id, @"^(node|way|relation)/[0-9]{1,20}$",
                RegexOptions.CultureInvariant, TimeSpan.FromMilliseconds(100)) ||
            string.IsNullOrWhiteSpace(place.Name) || place.Name.Length > 120 ||
            place.Category is not ("restaurant" or "cafe" or "fast_food") ||
            !ValidCoordinates(place.Lat, place.Lng))
            throw new ArgumentException("Invalid meeting place.");

        var match = await GetMatchWithActiveSharingAsync(requestId, userId);
        var from = await tempUserRepository.GetByIdAsync(match.FromTempUserId);
        var to = await tempUserRepository.GetByIdAsync(match.ToTempUserId);
        var midpointLat = (from!.CurrentLat!.Value + to!.CurrentLat!.Value) / 2;
        var midpointLng = (from.CurrentLng!.Value + to.CurrentLng!.Value) / 2;
        if (HaversineMeters(midpointLat, midpointLng, place.Lat, place.Lng) > 2000)
            throw new ArgumentException("Meeting place is too far from the midpoint.");
        match.MeetingPlaceId = place.Id;
        match.MeetingPlaceName = place.Name;
        match.MeetingPlaceCategory = place.Category;
        match.MeetingPlaceLat = place.Lat;
        match.MeetingPlaceLng = place.Lng;
        match.MeetingPlaceGoogleMapsUrl = null;
        match.MeetingPlaceProposedBy = userId;
        match.MeetingPlaceAgreedAt = null;
        await matchRequestRepository.UpdateAsync(match);
        return await MapToDtoAsync(match, userId);
    }

    public async Task<MatchRequestDto> ProposeGoogleMeetingPlaceAsync(
        int requestId, Guid userId, ProposeGoogleMeetingPlaceDto place)
    {
        var name = place?.Name?.Trim();
        var urlText = place?.GoogleMapsUrl?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 120 ||
            string.IsNullOrWhiteSpace(urlText) || urlText.Length > 2048 ||
            !Uri.TryCreate(urlText, UriKind.Absolute, out var url) ||
            url.Scheme != Uri.UriSchemeHttps || url.UserInfo.Length > 0 ||
            !url.IsDefaultPort ||
            !((url.Host is "www.google.com" or "google.com" or "maps.google.com") &&
                (url.AbsolutePath == "/maps" || url.AbsolutePath.StartsWith("/maps/", StringComparison.Ordinal))) &&
            url.Host != "maps.app.goo.gl")
            throw new ArgumentException("Enter a valid Google Maps place name and link.");

        var match = await GetMatchWithActiveSharingAsync(requestId, userId);
        var normalizedUrl = url.AbsoluteUri;
        if (normalizedUrl.Length > 2048)
            throw new ArgumentException("Google Maps link is too long.");
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedUrl));
        match.MeetingPlaceId = "google:" + Convert.ToHexString(hash.AsSpan(0, 28));
        match.MeetingPlaceName = name;
        match.MeetingPlaceCategory = "google_maps";
        match.MeetingPlaceLat = null;
        match.MeetingPlaceLng = null;
        match.MeetingPlaceGoogleMapsUrl = normalizedUrl;
        match.MeetingPlaceProposedBy = userId;
        match.MeetingPlaceAgreedAt = null;
        await matchRequestRepository.UpdateAsync(match);
        return await MapToDtoAsync(match, userId);
    }

    public async Task<MatchRequestDto> ConfirmMeetingPlaceAsync(
        int requestId, Guid userId, string expectedPlaceId)
    {
        var match = await GetMatchWithActiveSharingAsync(requestId, userId);
        if (match.MeetingPlaceId == null || match.MeetingPlaceId != expectedPlaceId ||
            match.MeetingPlaceProposedBy == userId || match.MeetingPlaceAgreedAt.HasValue)
            throw new InvalidOperationException("Meeting place proposal is no longer available.");

        match.MeetingPlaceAgreedAt = DateTime.UtcNow;
        await matchRequestRepository.UpdateAsync(match);
        return await MapToDtoAsync(match, userId);
    }

    private async Task<MatchRequest> GetMatchWithActiveSharingAsync(int requestId, Guid userId)
    {
        var match = await matchRequestRepository.GetByIdAsync(requestId)
            ?? throw new KeyNotFoundException("Match request not found.");
        if (match.FromTempUserId != userId && match.ToTempUserId != userId)
            throw new UnauthorizedAccessException("You are not part of this match.");
        var from = await tempUserRepository.GetByIdAsync(match.FromTempUserId);
        var to = await tempUserRepository.GetByIdAsync(match.ToTempUserId);
        if (match.Status != FoodMatch.Domain.Enums.MatchStatus.Accepted ||
            !IsSharingActive(match.FromUserSharedLocation, match.FromUserSharedAt, DateTime.UtcNow) ||
            !IsSharingActive(match.ToUserSharedLocation, match.ToUserSharedAt, DateTime.UtcNow) ||
            from?.ExpiresAt <= DateTime.UtcNow || to?.ExpiresAt <= DateTime.UtcNow ||
            from?.CurrentLat == null || from.CurrentLng == null ||
            to?.CurrentLat == null || to.CurrentLng == null)
            throw new UnauthorizedAccessException("Both participants must share active locations.");
        return match;
    }

    private static bool ValidCoordinates(double lat, double lng) =>
        double.IsFinite(lat) && double.IsFinite(lng) &&
        lat is >= -90 and <= 90 && lng is >= -180 and <= 180;

    private static double HaversineMeters(double lat1, double lng1, double lat2, double lng2)
    {
        const double radius = 6371000;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLng = (lng2 - lng1) * Math.PI / 180;
        var a = Math.Pow(Math.Sin(dLat / 2), 2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Pow(Math.Sin(dLng / 2), 2);
        return radius * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static void ClearMeetingPlace(MatchRequest match)
    {
        match.MeetingPlaceId = null;
        match.MeetingPlaceName = null;
        match.MeetingPlaceCategory = null;
        match.MeetingPlaceLat = null;
        match.MeetingPlaceLng = null;
        match.MeetingPlaceGoogleMapsUrl = null;
        match.MeetingPlaceProposedBy = null;
        match.MeetingPlaceAgreedAt = null;
    }

    private static bool IsSharingActive(bool shared, DateTime? sharedAt, DateTime now) =>
        shared && sharedAt.HasValue && sharedAt.Value <= now &&
        sharedAt.Value > now.AddMinutes(-60);

    private static void ExpireInactiveShares(MatchRequest match, DateTime now)
    {
        var fromExpired = match.FromUserSharedLocation &&
            !IsSharingActive(true, match.FromUserSharedAt, now);
        var toExpired = match.ToUserSharedLocation &&
            !IsSharingActive(true, match.ToUserSharedAt, now);
        if (fromExpired)
        {
            match.FromUserSharedLocation = false;
            match.FromUserSharedAt = null;
        }
        if (toExpired)
        {
            match.ToUserSharedLocation = false;
            match.ToUserSharedAt = null;
        }
        if (fromExpired || toExpired) ClearMeetingPlace(match);
    }

    private async Task<MatchRequestDto> MapToDtoAsync(MatchRequest req, Guid currentUserId)
    {
        var fromUser = await tempUserRepository.GetByIdAsync(req.FromTempUserId);
        var toUser = await tempUserRepository.GetByIdAsync(req.ToTempUserId);

        var now = DateTime.UtcNow;
        var profilesActive = fromUser?.ExpiresAt > now && toUser?.ExpiresAt > now;
        var fromActive = profilesActive && req.Status == FoodMatch.Domain.Enums.MatchStatus.Accepted &&
            IsSharingActive(req.FromUserSharedLocation, req.FromUserSharedAt, now);
        var toActive = profilesActive && req.Status == FoodMatch.Domain.Enums.MatchStatus.Accepted &&
            IsSharingActive(req.ToUserSharedLocation, req.ToUserSharedAt, now);
        var callerIsFrom = req.FromTempUserId == currentUserId;
        var buddyActive = callerIsFrom ? toActive : fromActive;
        var mutual = fromActive && toActive;

        var dto = new MatchRequestDto
        {
            Id = req.Id,
            FromUserId = req.FromTempUserId,
            FromUserName = fromUser?.DisplayName ?? "Unknown",
            ToUserId = req.ToTempUserId,
            ToUserName = toUser?.DisplayName ?? "Unknown",
            Status = req.Status.ToString(),
            CreatedAt = req.CreatedAt,
            LocationSharedAt = mutual
                ? (req.FromUserSharedAt > req.ToUserSharedAt
                    ? req.FromUserSharedAt : req.ToUserSharedAt)
                : null,
            HasSharedLocation = callerIsFrom ? fromActive : toActive,
            BuddyHasSharedLocation = buddyActive
        };

        if (buddyActive)
        {
            var buddy = callerIsFrom ? toUser : fromUser;

            if (buddy != null)
            {
                dto.BuddyLat = buddy.CurrentLat;
                dto.BuddyLng = buddy.CurrentLng;
            }
        }
        if (mutual)
        {
            if (req.MeetingPlaceId != null && req.MeetingPlaceName != null &&
                req.MeetingPlaceCategory != null && req.MeetingPlaceProposedBy.HasValue &&
                ((req.MeetingPlaceLat.HasValue && req.MeetingPlaceLng.HasValue) ||
                 req.MeetingPlaceGoogleMapsUrl != null))
                dto.MeetingPlace = new MeetingPlaceChoiceDto(
                    req.MeetingPlaceId, req.MeetingPlaceName, req.MeetingPlaceCategory,
                    req.MeetingPlaceLat, req.MeetingPlaceLng,
                    req.MeetingPlaceProposedBy.Value, req.MeetingPlaceAgreedAt,
                    req.MeetingPlaceGoogleMapsUrl);
        }

        return dto;
    }
}
