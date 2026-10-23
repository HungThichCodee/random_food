using FoodMatch.Application.DTOs.TempUser;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for managing anonymous temporary users and their locations.
/// </summary>
public interface ITempUserService
{
    Task<TempUserDto> CreateTempUserAsync(CreateTempUserDto dto);
    Task<TempUserDto?> GetBySessionTokenAsync(string sessionToken);
    Task<TempUserDto?> GetByIdAsync(Guid userId);
    Task UpdateLocationAsync(Guid userId, double lat, double lng);
    Task<List<NearbyUserDto>> GetNearbyUsersAsync(double lat, double lng);
    Task SetLocationVisibilityAsync(Guid userId, bool visible);
    Task CleanupExpiredUsersAsync();
}
