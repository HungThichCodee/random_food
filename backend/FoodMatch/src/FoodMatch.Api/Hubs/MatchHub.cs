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
    // Match notifications are sent by the authorized API after a database change.
}
