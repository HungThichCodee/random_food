using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FoodMatch.Application.Interfaces;

namespace FoodMatch.Api.Hubs;

/// <summary>
/// SignalR hub for real-time chat between matched users.
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService) => _chatService = chatService;

    public override async Task OnConnectedAsync()
    {
        if (!Guid.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            throw new HubException("Unauthorized");

        foreach (var matchId in await _chatService.GetActiveMatchIdsAsync(userId))
            await Groups.AddToGroupAsync(Context.ConnectionId, matchId.ToString());

        await base.OnConnectedAsync();
    }

    public async Task JoinChatGroup(string matchId)
    {
        if (!Guid.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ||
            !int.TryParse(matchId, out var requestId) ||
            !await _chatService.CanAccessMatchAsync(requestId, userId))
            throw new HubException("Unauthorized");
        await Groups.AddToGroupAsync(Context.ConnectionId, matchId);
    }
}
