using FoodMatch.Application.DTOs.TempUser;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for managing anonymous temporary users and their locations.
/// </summary>
public interface ITempUserService
{
    Task<TempUserDto> CreateTempUserAsync(CreateTempUserDto dto);
    Task<TempUserDto?> GetBySessionTokenAsync(string sessionToken);
    Task UpdateLocationAsync(Guid userId, double lat, double lng);
    Task<List<TempUserDto>> GetNearbyUsersAsync(double lat, double lng, double radiusKm = 3.0);
    Task SetLocationVisibilityAsync(Guid userId, bool visible);
    Task CleanupExpiredUsersAsync();
}
