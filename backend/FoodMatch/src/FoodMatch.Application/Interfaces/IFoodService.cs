using FoodMatch.Application.DTOs.Food;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for food items and recommendation operations.
/// </summary>
public interface IFoodService
{
    Task<FoodResponseDto> GetRandomFoodAsync(string sessionId);
    Task<FoodResponseDto> GetRandomByCategoryAsync(string category, string sessionId);
    Task<SuggestResponseDto> SuggestFoodsAsync(FoodSuggestRequestDto request);
    Task<Dictionary<string, int>> GetTagCountsAsync(FoodSuggestRequestDto request);
    Task<IEnumerable<FoodResponseDto>> GetWheelFoodsAsync(string? category, int count = 8);
}
