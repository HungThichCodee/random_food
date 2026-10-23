using System.Text.Json;
using FoodMatch.Application.DTOs.TempUser;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;
using FoodMatch.Domain.Enums;

namespace FoodMatch.Application.Services;

/// <summary>
/// Service implementation for temporary user management and location tracking.
/// </summary>
public class TempUserService(
    IRepository<TempUser> tempUserRepository,
    IRepository<MatchRequest> matchRequestRepository,
    IRepository<ChatMessage> chatMessageRepository,
    IRepository<UserReport> userReportRepository,
    IUnitOfWork unitOfWork) : ITempUserService
{
    public async Task<TempUserDto> CreateTempUserAsync(CreateTempUserDto dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));
        if (string.IsNullOrWhiteSpace(dto.DisplayName))
            throw new ArgumentException("DisplayName is required.");
        var displayName = dto.DisplayName.Trim();
        if (displayName.Length is < 2 or > 100 || dto.Gender?.Length > 20 ||
            dto.DesiredFood?.Length > 100 || dto.FoodPreferences?.Count > 10 ||
            dto.FoodPreferences?.Any(preference =>
                string.IsNullOrWhiteSpace(preference) || preference.Length > 50) == true)
            throw new ArgumentException("Invalid profile fields.");
        
        var tempUser = new TempUser
        {
            Id = Guid.NewGuid(),
            SessionToken = Guid.NewGuid().ToString("N"),
            DisplayName = displayName,
            Gender = dto.Gender,
            DesiredFood = dto.DesiredFood,
            FoodPreferencesJson = dto.FoodPreferences != null
                ? JsonSerializer.Serialize(dto.FoodPreferences.Select(preference => preference.Trim()))
                : null,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(3),
            Status = UserStatus.Available,
            LocationVisible = false // Defaults to false until location is set
        };

        await tempUserRepository.AddAsync(tempUser);

        return MapToDto(tempUser);
    }

    public async Task<TempUserDto?> GetBySessionTokenAsync(string sessionToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
            return null;

        var users = await tempUserRepository.FindAsync(u => u.SessionToken == sessionToken && u.ExpiresAt > DateTime.UtcNow);
        var user = users.FirstOrDefault();
        return user != null ? MapToDto(user) : null;
    }

    public async Task<TempUserDto?> GetByIdAsync(Guid userId)
    {
        var user = await tempUserRepository.GetByIdAsync(userId);
        return user != null && user.ExpiresAt > DateTime.UtcNow ? MapToDto(user) : null;
    }

    public async Task UpdateLocationAsync(Guid userId, double lat, double lng)
    {
        if (!double.IsFinite(lat) || lat < -90 || lat > 90) throw new ArgumentException("Invalid latitude");
        if (!double.IsFinite(lng) || lng < -180 || lng > 180) throw new ArgumentException("Invalid longitude");

        var user = await tempUserRepository.GetByIdAsync(userId);
        if (user == null || user.ExpiresAt <= DateTime.UtcNow)
            throw new KeyNotFoundException($"Active TempUser with ID {userId} not found.");

        // First GPS fix makes a new profile discoverable. Later GPS updates must not
        // undo an explicit decision to hide it from nearby results.
        var firstLocation = !user.CurrentLat.HasValue || !user.CurrentLng.HasValue;
        user.CurrentLat = lat;
        user.CurrentLng = lng;
        if (firstLocation) user.LocationVisible = true;
        
        await tempUserRepository.UpdateAsync(user);
    }

    public async Task<List<NearbyUserDto>> GetNearbyUsersAsync(double lat, double lng)
    {
        if (!double.IsFinite(lat) || lat < -90 || lat > 90) throw new ArgumentException("Invalid latitude");
        if (!double.IsFinite(lng) || lng < -180 || lng > 180) throw new ArgumentException("Invalid longitude");
        var activeUsers = await tempUserRepository.FindAsync(u => 
            u.ExpiresAt > DateTime.UtcNow && 
            u.LocationVisible && 
            u.CurrentLat.HasValue && 
            u.CurrentLng.HasValue &&
            u.Status == UserStatus.Available);

        var nearbyUsers = activeUsers.Where(u =>
            NearbyDiscovery.Contains(lat, lng, u.CurrentLat!.Value, u.CurrentLng!.Value)).ToList();

        return nearbyUsers.Select(u => {
            return new NearbyUserDto
            {
                Id = u.Id,
                DisplayName = u.DisplayName,
                Gender = u.Gender,
                DesiredFood = u.DesiredFood,
                DistanceLabel = "Trong 3 km"
            };
        }).ToList();
    }

    public async Task SetLocationVisibilityAsync(Guid userId, bool visible)
    {
        var user = await tempUserRepository.GetByIdAsync(userId);
        if (user == null || user.ExpiresAt <= DateTime.UtcNow)
            throw new KeyNotFoundException($"TempUser with ID {userId} not found.");

        user.LocationVisible = visible;
        await tempUserRepository.UpdateAsync(user);
    }

    public async Task CleanupExpiredUsersAsync()
    {
        var expiredUsers = await tempUserRepository.FindAsync(u => u.ExpiresAt <= DateTime.UtcNow);
        foreach (var user in expiredUsers)
        {
            await unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                // A partially deleted profile must not be committed.
                var userChats = await chatMessageRepository.FindAsync(c => c.SenderTempUserId == user.Id);
                foreach (var chat in userChats)
                {
                    await chatMessageRepository.DeleteAsync(chat);
                }

                var relatedRequests = await matchRequestRepository.FindAsync(
                    m => m.FromTempUserId == user.Id || m.ToTempUserId == user.Id);
                foreach (var req in relatedRequests)
                {
                    var reqChats = await chatMessageRepository.FindAsync(c => c.MatchRequestId == req.Id);
                    foreach (var chat in reqChats)
                        await chatMessageRepository.DeleteAsync(chat);
                    await matchRequestRepository.DeleteAsync(req);
                }

                var relatedReports = await userReportRepository.FindAsync(
                    r => r.ReporterTempUserId == user.Id || r.ReportedTempUserId == user.Id);
                foreach (var report in relatedReports)
                    await userReportRepository.DeleteAsync(report);

                await tempUserRepository.DeleteAsync(user);
            });
        }
    }

    private static TempUserDto MapToDto(TempUser entity)
    {
        var prefs = string.IsNullOrEmpty(entity.FoodPreferencesJson)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(entity.FoodPreferencesJson) ?? new List<string>();

        return new TempUserDto
        {
            Id = entity.Id,
            DisplayName = entity.DisplayName,
            Gender = entity.Gender,
            DesiredFood = entity.DesiredFood,
            CurrentLat = entity.CurrentLat,
            CurrentLng = entity.CurrentLng,
            LocationVisible = entity.LocationVisible,
            Status = entity.Status.ToString(),
            ExpiresAt = entity.ExpiresAt,
            FoodPreferences = prefs
        };
    }

}
