using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Chat;
using FoodMatch.Api.Hubs;

namespace FoodMatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController(
    IChatService chatService,
    IHubContext<ChatHub> chatHubContext) : ControllerBase
{
    [HttpGet("{matchRequestId}/messages")]
    public async Task<IActionResult> GetMessages(int matchRequestId)
    {
        var messages = await chatService.GetMessagesAsync(matchRequestId);
        return Ok(messages);
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            return Unauthorized();

        try
        {
            var message = await chatService.SendMessageAsync(userId, dto);
            
            // Notify other users in the chat room (match group)
            await chatHubContext.Clients.Group(dto.MatchRequestId.ToString())
                .SendAsync("ReceiveMessage", message);

            return Ok(message);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
