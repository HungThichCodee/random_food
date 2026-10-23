using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Chat;
using FoodMatch.Api.Hubs;
using Microsoft.AspNetCore.RateLimiting;

namespace FoodMatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("GeneralApi")]
public class ChatController(
    IChatService chatService,
    IHubContext<ChatHub> chatHubContext) : ControllerBase
{
    [HttpGet("{matchRequestId}/messages")]
    public async Task<IActionResult> GetMessages(int matchRequestId)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
        if (!await chatService.CanAccessMatchAsync(matchRequestId, userId)) return Forbid();
        var messages = await chatService.GetMessagesAsync(matchRequestId, userId);
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
            try
            {
                await chatHubContext.Clients.Group(dto.MatchRequestId.ToString())
                    .SendAsync("ReceiveMessage", message);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // The message is saved; clients can load it from the history endpoint.
                HttpContext.RequestServices.GetService<ILogger<ChatController>>()?
                    .LogWarning("Chat notification failed: {ErrorType} at {UtcTime:o}",
                        ex.GetType().Name, DateTime.UtcNow);
            }

            return Ok(message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "An internal error occurred." });
        }
    }
}
