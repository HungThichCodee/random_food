using Microsoft.AspNetCore.SignalR;

namespace FoodMatch.Api.Hubs;

/// <summary>
/// SignalR hub for real-time location updates.
/// Handles: UpdateLocation, JoinNearbyGroup, NearbyUsersUpdated
/// </summary>
public class LocationHub : Hub
{
    // TODO: Implement location broadcasting
    // - UpdateLocation(double lat, double lng)
    // - JoinNearbyGroup(double lat, double lng)
    // - Broadcast NearbyUsersUpdated to nearby users
}
