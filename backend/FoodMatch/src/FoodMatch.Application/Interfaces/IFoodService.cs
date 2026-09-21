using FoodMatch.Application.DTOs.Food;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for food items and recommendation operations.
/// </summary>
public interface IFoodService
{
    Task<FoodDto> GetRandomFoodAsync();
    Task<FoodDto> GetRandomFoodByCategoryAsync(string category);
    Task<List<FoodDto>> SuggestByCriteriaAsync(FoodCriteriaDto criteria);
    Task<List<string>> GetAllTagsAsync();
    Task LogSuggestionAsync(Guid? tempUserId, int foodId, string suggestionType);
}
