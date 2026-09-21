namespace FoodMatch.Application.Services;

using FoodMatch.Application.DTOs.Chat;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;

/// <summary>
/// Service implementation for chat messaging between matched dining users.
/// </summary>
public class ChatService(
    IRepository<ChatMessage> chatMessageRepository) : IChatService
{
    public Task<ChatMessageDto> SendMessageAsync(Guid senderUserId, SendMessageDto dto)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 4
    }

    public Task<List<ChatMessageDto>> GetMessagesAsync(int matchRequestId)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 4
    }
}
