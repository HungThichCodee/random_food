using FoodMatch.Domain.Enums;

namespace FoodMatch.Domain.Entities;

/// <summary>
/// Log of food suggestions to avoid repetition within a session.
/// Maps to the 'food_suggestion_logs' table.
/// </summary>
public class FoodSuggestionLog
{
    public int Id { get; set; }
    public Guid? TempUserId { get; set; }
    public TempUser? TempUser { get; set; }
    public int FoodId { get; set; }
    public Food Food { get; set; } = null!;
    public SuggestionType? SuggestionType { get; set; }  // random_all / random_by_type / by_criteria
    public DateTime SuggestedAt { get; set; } = DateTime.UtcNow;
}
