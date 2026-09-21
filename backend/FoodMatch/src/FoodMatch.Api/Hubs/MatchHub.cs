using Microsoft.AspNetCore.SignalR;

namespace FoodMatch.Api.Hubs;

/// <summary>
/// SignalR hub for match request notifications.
/// Handles: MatchRequestReceived, MatchRequestResponded
/// </summary>
public class MatchHub : Hub
{
    // TODO: Implement match notifications
    // - NotifyMatchRequest(matchRequestDto)
    // - NotifyMatchResponse(matchRequestDto)
}
