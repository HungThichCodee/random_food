namespace FoodMatch.Application.Services;

using FoodMatch.Application.DTOs.Food;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;
using FoodMatch.Domain.Enums;

/// <summary>
/// Service implementation for food recommendations and suggestions.
/// </summary>
public class FoodService(
    IRepository<Food> foodRepository,
    IRepository<FoodSuggestionLog> suggestionLogRepository,
    IRepository<TempUser> tempUserRepository) : IFoodService
{
    public async Task<FoodResponseDto> GetRandomFoodAsync(string sessionId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(sessionId))
                throw new ArgumentException("SessionId is required", nameof(sessionId));

            var foods = await foodRepository.GetAllWithIncludesAsync("FoodFoodTags.Tag");
            return await PickRandomFoodAsync(foods, sessionId, SuggestionType.RandomAll);
        }
        catch (ArgumentException) { throw; }
        catch (Exception ex)
        {
            throw new ApplicationException($"Error retrieving random food: {ex.Message}", ex);
        }
    }

    public async Task<FoodResponseDto> GetRandomByCategoryAsync(string category, string sessionId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(category))
                throw new ArgumentException("Category is required", nameof(category));
            if (string.IsNullOrWhiteSpace(sessionId))
                throw new ArgumentException("SessionId is required", nameof(sessionId));

            var foods = await foodRepository.GetAllWithIncludesAsync("FoodFoodTags.Tag");
            var categoryEnum = Enum.Parse<FoodCategory>(category, true);
            foods = foods.Where(f => f.Category == categoryEnum).ToList();
            
            return await PickRandomFoodAsync(foods, sessionId, SuggestionType.RandomByType);
        }
        catch (ArgumentException) { throw; }
        catch (Exception ex)
        {
            throw new ApplicationException($"Error retrieving random food by category: {ex.Message}", ex);
        }
    }

    public async Task<FoodResponseDto> SuggestFoodsAsync(FoodSuggestRequestDto request)
    {
        try
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));
            if (string.IsNullOrWhiteSpace(request.SessionId))
                throw new ArgumentException("SessionId is required", nameof(request.SessionId));

            var foods = await foodRepository.GetAllWithIncludesAsync("FoodFoodTags.Tag");

            if (!string.IsNullOrEmpty(request.MealTime) && Enum.TryParse<MealTime>(request.MealTime, true, out var mealTime))
            {
                foods = foods.Where(f => f.MealTime == mealTime).ToList();
            }

            if (!string.IsNullOrEmpty(request.PriceRange) && Enum.TryParse<PriceRange>(request.PriceRange, true, out var priceRange))
            {
                foods = foods.Where(f => f.AvgPriceRange == priceRange).ToList();
            }

            if (request.IncludedTags != null && request.IncludedTags.Any())
            {
                foods = foods.Where(f => request.IncludedTags.All(t => f.FoodFoodTags.Any(ft => ft.Tag.Name.Equals(t, StringComparison.OrdinalIgnoreCase)))).ToList();
            }
            
            if (request.ExcludedTags != null && request.ExcludedTags.Any())
            {
                foods = foods.Where(f => !request.ExcludedTags.Any(t => f.FoodFoodTags.Any(ft => ft.Tag.Name.Equals(t, StringComparison.OrdinalIgnoreCase)))).ToList();
            }

            return await PickRandomFoodAsync(foods, request.SessionId, SuggestionType.ByCriteria);
        }
        catch (ArgumentException) { throw; }
        catch (Exception ex)
        {
            throw new ApplicationException($"Error suggesting foods: {ex.Message}", ex);
        }
    }

    private async Task<FoodResponseDto> PickRandomFoodAsync(IEnumerable<Food> sourceFoods, string sessionId, SuggestionType type)
    {
        var foods = sourceFoods.Where(f => f.IsActive).ToList();
        if (!foods.Any()) throw new Exception("No foods found matching criteria.");

        var random = new Random();
        var selectedFood = foods[random.Next(foods.Count)];

        if (Guid.TryParse(sessionId, out var userId))
        {
            var userExists = await tempUserRepository.GetByIdAsync(userId) != null;
            if (userExists)
            {
                await suggestionLogRepository.AddAsync(new FoodSuggestionLog
                {
                    TempUserId = userId,
                    FoodId = selectedFood.Id,
                    SuggestionType = type,
                    SuggestedAt = DateTime.UtcNow
                });
            }
        }

        return MapToDto(selectedFood);
    }

    private static FoodResponseDto MapToDto(Food food)
    {
        return new FoodResponseDto
        {
            Id = food.Id,
            Name = food.Name ?? string.Empty,
            Category = food.Category.ToString() ?? string.Empty,
            CuisineType = food.CuisineType ?? string.Empty,
            AvgPriceRange = food.AvgPriceRange.ToString() ?? string.Empty,
            MealTime = food.MealTime.ToString() ?? string.Empty,
            Tags = food.FoodFoodTags?.Select(ft => ft.Tag?.Name ?? string.Empty).ToList() ?? new List<string>()
        };
    }
}
