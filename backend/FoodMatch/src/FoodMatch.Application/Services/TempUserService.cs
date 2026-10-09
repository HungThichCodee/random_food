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
    IRepository<UserReport> userReportRepository) : ITempUserService
{
    private static readonly Random _random = new();

    public async Task<TempUserDto> CreateTempUserAsync(CreateTempUserDto dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));
        if (string.IsNullOrWhiteSpace(dto.DisplayName))
            throw new ArgumentException("DisplayName is required.");
        
        var tempUser = new TempUser
        {
            Id = Guid.NewGuid(),
            SessionToken = Guid.NewGuid().ToString("N"),
            DisplayName = dto.DisplayName,
            Gender = dto.Gender,
            DesiredFood = dto.DesiredFood,
            FoodPreferencesJson = dto.FoodPreferences != null ? JsonSerializer.Serialize(dto.FoodPreferences) : null,
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

    public async Task UpdateLocationAsync(Guid userId, double lat, double lng)
    {
        if (lat < -90 || lat > 90) throw new ArgumentException("Invalid latitude");
        if (lng < -180 || lng > 180) throw new ArgumentException("Invalid longitude");

        var user = await tempUserRepository.GetByIdAsync(userId);
        if (user == null || user.ExpiresAt <= DateTime.UtcNow)
            throw new KeyNotFoundException($"Active TempUser with ID {userId} not found.");

        // Storing exact location so users can actually find each other when matched.
        user.CurrentLat = lat;
        user.CurrentLng = lng;
        user.LocationVisible = true;
        
        await tempUserRepository.UpdateAsync(user);
    }

    public async Task<List<NearbyUserDto>> GetNearbyUsersAsync(double lat, double lng, double radiusKm = 3.0)
    {
        if (lat < -90 || lat > 90) throw new ArgumentException("Invalid latitude");
        if (lng < -180 || lng > 180) throw new ArgumentException("Invalid longitude");
        if (radiusKm <= 0 || radiusKm > 50) throw new ArgumentException("Radius must be between 0 and 50km");

        var activeUsers = await tempUserRepository.FindAsync(u => 
            u.ExpiresAt > DateTime.UtcNow && 
            u.LocationVisible && 
            u.CurrentLat.HasValue && 
            u.CurrentLng.HasValue &&
            u.Status == UserStatus.Available);

        var nearbyUsers = activeUsers.Where(u =>
        {
            var distance = CalculateHaversineDistance(lat, lng, u.CurrentLat!.Value, u.CurrentLng!.Value);
            return distance <= radiusKm;
        }).ToList();

        return nearbyUsers.Select(u => {
            var distance = CalculateHaversineDistance(lat, lng, u.CurrentLat!.Value, u.CurrentLng!.Value);
            var distanceMeters = distance * 1000;
            var roundedDistance = Math.Round(distanceMeters / 100) * 100;
            
            return new NearbyUserDto
            {
                Id = u.Id,
                DisplayName = u.DisplayName,
                Gender = u.Gender,
                DesiredFood = u.DesiredFood,
                DistanceLabel = $"~{roundedDistance} m"
            };
        }).ToList();
    }

    public async Task SetLocationVisibilityAsync(Guid userId, bool visible)
    {
        var user = await tempUserRepository.GetByIdAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"TempUser with ID {userId} not found.");

        user.LocationVisible = visible;
        await tempUserRepository.UpdateAsync(user);
    }

    public async Task CleanupExpiredUsersAsync()
    {
        var expiredUsers = await tempUserRepository.FindAsync(u => u.ExpiresAt <= DateTime.UtcNow);
        foreach (var user in expiredUsers)
        {
            // Delete ChatMessages sent by the user
            var userChats = await chatMessageRepository.FindAsync(c => c.SenderTempUserId == user.Id);
            foreach (var chat in userChats)
            {
                await chatMessageRepository.DeleteAsync(chat);
            }

            // Delete MatchRequests involving the user and their associated ChatMessages
            var relatedRequests = await matchRequestRepository.FindAsync(m => m.FromTempUserId == user.Id || m.ToTempUserId == user.Id);
            foreach (var req in relatedRequests)
            {
                var reqChats = await chatMessageRepository.FindAsync(c => c.MatchRequestId == req.Id);
                foreach (var chat in reqChats)
                {
                    await chatMessageRepository.DeleteAsync(chat);
                }
                await matchRequestRepository.DeleteAsync(req);
            }

            // Delete UserReports involving the user
            var relatedReports = await userReportRepository.FindAsync(r => r.ReporterTempUserId == user.Id || r.ReportedTempUserId == user.Id);
            foreach (var report in relatedReports)
            {
                await userReportRepository.DeleteAsync(report);
            }

            // Finally, delete the expired user
            await tempUserRepository.DeleteAsync(user);
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
            SessionToken = entity.SessionToken,
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

    private static (double, double) AddRandomOffset(double lat, double lng)
    {
        // 1 degree of latitude = ~111km
        // 50m = 0.00045 degrees, 150m = 0.00135 degrees
        double distanceMeters = _random.Next(50, 151);
        double distanceDegrees = distanceMeters / 111000.0;
        
        // Random angle in radians
        double angle = _random.NextDouble() * Math.PI * 2;
        
        double offsetLat = lat + (distanceDegrees * Math.Cos(angle));
        
        // Adjust longitude offset by latitude
        double offsetLng = lng + (distanceDegrees * Math.Sin(angle)) / Math.Cos(lat * Math.PI / 180.0);
        
        return (offsetLat, offsetLng);
    }

    private static double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var R = 6371d; // Earth radius in km
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLon = (lon2 - lon1) * Math.PI / 180.0;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }
}
