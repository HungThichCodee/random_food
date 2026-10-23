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
    IRepository<MatchRequest> matchRequestRepository,
    IRepository<TempUser> tempUserRepository) : IChatService
{
    public async Task<ChatMessageDto> SendMessageAsync(Guid senderUserId, SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Message) || dto.Message.Length > 1000)
            throw new ArgumentException("Message must contain 1 to 1000 characters.");
        var match = await matchRequestRepository.GetByIdAsync(dto.MatchRequestId);
        if (match == null) throw new KeyNotFoundException("Match request not found.");
        if (match.Status != MatchStatus.Accepted) throw new InvalidOperationException("Match is not active.");
        if (match.FromTempUserId != senderUserId && match.ToTempUserId != senderUserId)
        {
            throw new UnauthorizedAccessException("Unauthorized to send message in this match.");
        }
        if (!await BothProfilesActiveAsync(match))
            throw new UnauthorizedAccessException("A match profile has expired.");

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

    public async Task<bool> CanAccessMatchAsync(int matchRequestId, Guid userId)
    {
        var match = await matchRequestRepository.GetByIdAsync(matchRequestId);
        return match != null && match.Status == MatchStatus.Accepted &&
            (match.FromTempUserId == userId || match.ToTempUserId == userId) &&
            await BothProfilesActiveAsync(match);
    }

    public async Task<IReadOnlyList<int>> GetActiveMatchIdsAsync(Guid userId)
    {
        var matches = await matchRequestRepository.FindAsync(match =>
            match.Status == MatchStatus.Accepted &&
            (match.FromTempUserId == userId || match.ToTempUserId == userId));
        var activeIds = new List<int>();
        foreach (var match in matches)
            if (await BothProfilesActiveAsync(match)) activeIds.Add(match.Id);
        return activeIds;
    }

    private async Task<bool> BothProfilesActiveAsync(MatchRequest match)
    {
        var from = await tempUserRepository.GetByIdAsync(match.FromTempUserId);
        var to = await tempUserRepository.GetByIdAsync(match.ToTempUserId);
        var now = DateTime.UtcNow;
        return from?.ExpiresAt > now && to?.ExpiresAt > now;
    }

    public async Task<List<ChatMessageDto>> GetMessagesAsync(int matchRequestId, Guid userId)
    {
        if (!await CanAccessMatchAsync(matchRequestId, userId))
            throw new UnauthorizedAccessException("You are not part of this active match.");
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
