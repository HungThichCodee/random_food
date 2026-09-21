namespace FoodMatch.Application.Services;

using FoodMatch.Application.DTOs.Food;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;

/// <summary>
/// Service implementation for food recommendations and suggestions.
/// </summary>
public class FoodService(
    IRepository<Food> foodRepository,
    IRepository<FoodSuggestionLog> suggestionLogRepository) : IFoodService
{
    public Task<FoodDto> GetRandomFoodAsync()
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 2
    }

    public Task<FoodDto> GetRandomFoodByCategoryAsync(string category)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 2
    }

    public Task<List<FoodDto>> SuggestByCriteriaAsync(FoodCriteriaDto criteria)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 2
    }

    public Task<List<string>> GetAllTagsAsync()
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 2
    }

    public Task LogSuggestionAsync(Guid? tempUserId, int foodId, string suggestionType)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 2
    }
}
