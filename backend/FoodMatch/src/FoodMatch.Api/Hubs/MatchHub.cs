using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FoodMatch.Api.Hubs;

/// <summary>
/// SignalR hub for match request notifications.
/// </summary>
[Authorize]
public class MatchHub : Hub
{
    // Will be fully implemented in Phase 12
    public async Task SendMatchRequest(Guid targetUserId)
    {
        var userIdString = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            throw new HubException("Unauthorized");
        }
        
        // Notify target user via their ConnectionId or User group
        await Clients.User(targetUserId.ToString()).SendAsync("MatchRequestReceived", new { FromUserId = userId });
    }
}
