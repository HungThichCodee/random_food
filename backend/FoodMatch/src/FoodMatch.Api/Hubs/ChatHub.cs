using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FoodMatch.Api.Hubs;

/// <summary>
/// SignalR hub for real-time chat between matched users.
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    // Will be fully implemented in Phase 13
    public async Task SendMessage(string matchId, string message)
    {
        var userIdString = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            throw new HubException("Unauthorized");
        }

        // Send to group representing the match
        await Clients.Group(matchId).SendAsync("ReceiveMessage", new { FromUserId = userId, Message = message });
    }

    public async Task JoinChatGroup(string matchId)
    {
        // Add current connection to the match chat group
        await Groups.AddToGroupAsync(Context.ConnectionId, matchId);
    }
}
