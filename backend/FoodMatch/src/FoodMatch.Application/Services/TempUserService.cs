namespace FoodMatch.Application.Services;

using FoodMatch.Application.DTOs.TempUser;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;

/// <summary>
/// Service implementation for temporary user management and location tracking.
/// </summary>
public class TempUserService(
    IRepository<TempUser> tempUserRepository) : ITempUserService
{
    public Task<TempUserDto> CreateTempUserAsync(CreateTempUserDto dto)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 3
    }

    public Task<TempUserDto?> GetBySessionTokenAsync(string sessionToken)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 3
    }

    public Task UpdateLocationAsync(Guid userId, double lat, double lng)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 3
    }

    public Task<List<TempUserDto>> GetNearbyUsersAsync(double lat, double lng, double radiusKm = 3.0)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 3
    }

    public Task SetLocationVisibilityAsync(Guid userId, bool visible)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 3
    }

    public Task CleanupExpiredUsersAsync()
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 3
    }
}
