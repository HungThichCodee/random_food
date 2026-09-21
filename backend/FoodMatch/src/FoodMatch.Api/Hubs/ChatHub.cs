using Microsoft.AspNetCore.SignalR;

namespace FoodMatch.Api.Hubs;

/// <summary>
/// SignalR hub for real-time chat between matched users.
/// Handles: SendMessage, JoinChat, ReceiveMessage
/// </summary>
public class ChatHub : Hub
{
    // TODO: Implement chat messaging
    // - JoinChat(int matchRequestId)
    // - SendMessage(int matchRequestId, string message)
    // - Broadcast ReceiveMessage to chat participants
}
