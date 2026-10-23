using System.ComponentModel.DataAnnotations;

namespace FoodMatch.Application.DTOs.Chat;

/// <summary>
/// DTO for sending a chat message to a matched dining partner.
/// </summary>
public class SendMessageDto
{
    public int MatchRequestId { get; set; }
    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string Message { get; set; } = string.Empty;
}
