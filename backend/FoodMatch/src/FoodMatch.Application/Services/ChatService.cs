using FoodMatch.Domain.Enums;

namespace FoodMatch.Application.Services;

using FoodMatch.Application.DTOs.Chat;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;

/// <summary>
/// Service implementation for chat messaging between matched dining users.
/// </summary>
public class ChatService(
    IRepository<ChatMessage> chatMessageRepository,
    IRepository<MatchRequest> matchRequestRepository) : IChatService
{
    public async Task<ChatMessageDto> SendMessageAsync(Guid senderUserId, SendMessageDto dto)
    {
        var match = await matchRequestRepository.GetByIdAsync(dto.MatchRequestId);
        if (match == null) throw new Exception("Match request not found.");
        if (match.Status != MatchStatus.Accepted) throw new Exception("Match is not active.");
        if (match.FromTempUserId != senderUserId && match.ToTempUserId != senderUserId)
        {
            throw new Exception("Unauthorized to send message in this match.");
        }

        var message = new ChatMessage
        {
            MatchRequestId = dto.MatchRequestId,
            SenderTempUserId = senderUserId,
            Message = dto.Message,
            SentAt = DateTime.UtcNow
        };

        await chatMessageRepository.AddAsync(message);

        return new ChatMessageDto
        {
            Id = message.Id,
            SenderUserId = message.SenderTempUserId,
            SenderName = "User", // Can be retrieved if we join with TempUser
            Message = message.Message,
            SentAt = message.SentAt
        };
    }

    public async Task<List<ChatMessageDto>> GetMessagesAsync(int matchRequestId)
    {
        var messages = await chatMessageRepository.FindAsync(m => m.MatchRequestId == matchRequestId);
        return messages.OrderBy(m => m.SentAt).Select(m => new ChatMessageDto
        {
            Id = m.Id,
            SenderUserId = m.SenderTempUserId,
            SenderName = "User",
            Message = m.Message,
            SentAt = m.SentAt
        }).ToList();
    }
}
