using Microsoft.AspNetCore.Mvc;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Chat;

namespace FoodMatch.Api.Controllers;

/// <summary>
/// API controller for chat messaging between matched dining users.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpGet("{matchRequestId}/messages")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetMessages(int matchRequestId)
    {
        // TODO: Call _chatService.GetMessagesAsync
        throw new NotImplementedException();
    }
}
