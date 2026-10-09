using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FoodMatch.Application.Interfaces;

namespace FoodMatch.Api.Hubs;

/// <summary>
/// SignalR hub for real-time location updates.
/// Handles: UpdateLocation, JoinNearbyGroup, NearbyUsersUpdated
/// </summary>
[Authorize]
public class LocationHub : Hub
{
    private readonly ITempUserService _tempUserService;

    public LocationHub(ITempUserService tempUserService)
    {
        _tempUserService = tempUserService;
    }

    public async Task UpdateLocation(double lat, double lng)
    {
        var userIdString = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            throw new HubException("Unauthorized: Invalid Identity.");
        }

        try
        {
            await _tempUserService.UpdateLocationAsync(userId, lat, lng);
            // After updating location, we might want to fetch nearby users and send them to the caller
            // But this is usually polled by the client or pushed if we use a Redis backplane / groups.
            // For now, we just update the DB.
            var nearbyUsers = await _tempUserService.GetNearbyUsersAsync(lat, lng, 3.0);
            
            // Filter out current user
            var filteredNearbyUsers = nearbyUsers.Where(u => u.Id != userId).ToList();
            
            // Push to the user who just updated their location
            await Clients.Caller.SendAsync("NearbyUsersUpdated", filteredNearbyUsers);
        }
        catch (Exception ex)
        {
            throw new HubException($"Error updating location: {ex.Message}");
        }
    }
}
