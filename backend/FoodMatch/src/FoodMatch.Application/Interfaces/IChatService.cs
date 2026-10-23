using FoodMatch.Application.DTOs.Chat;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for real-time messaging between matched dining users.
/// </summary>
public interface IChatService
{
    Task<ChatMessageDto> SendMessageAsync(Guid senderUserId, SendMessageDto dto);
    Task<List<ChatMessageDto>> GetMessagesAsync(int matchRequestId, Guid userId);
    Task<bool> CanAccessMatchAsync(int matchRequestId, Guid userId);
    Task<IReadOnlyList<int>> GetActiveMatchIdsAsync(Guid userId);
}
