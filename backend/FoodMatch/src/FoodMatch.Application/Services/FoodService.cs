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
            foods = ApplyCategoryFilter(foods, category).ToList();
            
            return await PickRandomFoodAsync(foods, sessionId, SuggestionType.RandomByType);
        }
        catch (ArgumentException) { throw; }
        catch (Exception ex)
        {
            throw new ApplicationException($"Error retrieving random food by category: {ex.Message}", ex);
        }
    }

    public async Task<SuggestResponseDto> SuggestFoodsAsync(FoodSuggestRequestDto request)
    {
        try
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));
            if (string.IsNullOrWhiteSpace(request.SessionId))
                throw new ArgumentException("SessionId is required", nameof(request.SessionId));

            var allFoods = await foodRepository.GetAllWithIncludesAsync("FoodFoodTags.Tag");
            var activeFoods = allFoods.Where(f => f.IsActive).ToList();

            // 0. Hard Filter: DishType (Category)
            var baseFoods = ApplyCategoryFilter(activeFoods, request.Category).ToList();
            if (!baseFoods.Any())
            {
                return new SuggestResponseDto { MatchLevel = "empty", Message = "Không có món nào thuộc loại này." };
            }

            // Excluded tags always apply
            if (request.ExcludedTags != null && request.ExcludedTags.Any())
            {
                baseFoods = baseFoods.Where(f => !request.ExcludedTags.Any(t => f.FoodFoodTags.Any(ft => ft.Tag.Name.Equals(t, StringComparison.OrdinalIgnoreCase)))).ToList();
            }

            int CountMatchingTags(Food f)
            {
                if (request.IncludedTags == null || !request.IncludedTags.Any()) return 0;
                return request.IncludedTags.Count(t => f.FoodFoodTags.Any(ft => ft.Tag.Name.Equals(t, StringComparison.OrdinalIgnoreCase)));
            }

            var mealTimesToMatch = new List<MealTime>();
            if (request.MealTimes != null)
            {
                foreach (var mt in request.MealTimes)
                {
                    if (Enum.TryParse<MealTime>(mt, true, out var mte)) mealTimesToMatch.Add(mte);
                }
            }
            bool hasMealFilter = mealTimesToMatch.Any();
            
            bool hasBudgetFilter = !string.IsNullOrEmpty(request.PriceRange) && Enum.TryParse<PriceRange>(request.PriceRange, true, out var _);
            PriceRange budgetVal = hasBudgetFilter ? Enum.Parse<PriceRange>(request.PriceRange!, true) : PriceRange.Vua;
            
            bool hasTagFilter = request.IncludedTags != null && request.IncludedTags.Any();

            // Tầng 1: khớp đủ (loại món + ngân sách + buổi + vị/tag)
            var level1 = baseFoods.Where(f => 
                (!hasMealFilter || (f.MealTime.HasValue && mealTimesToMatch.Contains(f.MealTime.Value))) &&
                (!hasBudgetFilter || f.AvgPriceRange == budgetVal) &&
                (!hasTagFilter || request.IncludedTags!.All(t => f.FoodFoodTags.Any(ft => ft.Tag.Name.Equals(t, StringComparison.OrdinalIgnoreCase))))
            ).ToList();

            if (level1.Any())
            {
                return new SuggestResponseDto {
                    Items = level1.OrderByDescending(CountMatchingTags).Select(MapToDto).ToList(),
                    MatchLevel = "exact"
                };
            }

            // Tầng 2: bỏ vị/tag, giữ loại món + ngân sách + buổi
            var level2 = baseFoods.Where(f => 
                (!hasMealFilter || (f.MealTime.HasValue && mealTimesToMatch.Contains(f.MealTime.Value))) &&
                (!hasBudgetFilter || f.AvgPriceRange == budgetVal)
            ).ToList();

            if (level2.Any())
            {
                return new SuggestResponseDto {
                    Items = level2.OrderByDescending(CountMatchingTags).Select(MapToDto).ToList(),
                    MatchLevel = "relaxed",
                    Relaxed = new List<string> { "tastes" },
                    Message = "Không có món khớp hoàn toàn vị, hiển thị món khớp ngân sách và buổi ăn."
                };
            }

            // Tầng 3: nới buổi ăn, nới ngân sách lên một mức, giữ loại món
            var level3 = baseFoods.Where(f => 
                (!hasBudgetFilter || !f.AvgPriceRange.HasValue || f.AvgPriceRange == budgetVal || (int)f.AvgPriceRange.Value == (int)budgetVal + 1 || (int)f.AvgPriceRange.Value == (int)budgetVal - 1)
            ).ToList();

            if (level3.Any())
            {
                return new SuggestResponseDto {
                    Items = level3.OrderByDescending(CountMatchingTags).Select(MapToDto).ToList(),
                    MatchLevel = "relaxed",
                    Relaxed = new List<string> { "tastes", "mealTime", "budget" },
                    Message = "Đã nới lỏng ngân sách và buổi ăn."
                };
            }

            // Tầng 4: chỉ giữ loại món
            return new SuggestResponseDto {
                Items = baseFoods.OrderByDescending(CountMatchingTags).Select(MapToDto).ToList(),
                MatchLevel = "dishTypeOnly",
                Relaxed = new List<string> { "tastes", "mealTime", "budget" },
                Message = "Chỉ lọc theo loại món."
            };
        }
        catch (ArgumentException) { throw; }
        catch (Exception ex)
        {
            throw new ApplicationException($"Error suggesting foods: {ex.Message}", ex);
        }
    }

    public async Task<Dictionary<string, int>> GetTagCountsAsync(FoodSuggestRequestDto request)
    {
        var allFoods = await foodRepository.GetAllWithIncludesAsync("FoodFoodTags.Tag");
        var activeFoods = allFoods.Where(f => f.IsActive).ToList();

        // 0. Hard Filter: DishType (Category)
        var baseFoods = ApplyCategoryFilter(activeFoods, request.Category).ToList();

        var mealTimesToMatch = new List<MealTime>();
        if (request.MealTimes != null)
        {
            foreach (var mt in request.MealTimes)
            {
                if (Enum.TryParse<MealTime>(mt, true, out var mte)) mealTimesToMatch.Add(mte);
            }
        }
        bool hasMealFilter = mealTimesToMatch.Any();
        
        bool hasBudgetFilter = !string.IsNullOrEmpty(request.PriceRange) && Enum.TryParse<PriceRange>(request.PriceRange, true, out var _);
        PriceRange budgetVal = hasBudgetFilter ? Enum.Parse<PriceRange>(request.PriceRange!, true) : PriceRange.Vua;

        var filteredFoods = baseFoods.Where(f => 
            (!hasMealFilter || (f.MealTime.HasValue && mealTimesToMatch.Contains(f.MealTime.Value))) &&
            (!hasBudgetFilter || f.AvgPriceRange == budgetVal)
        ).ToList();

        var tagCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var food in filteredFoods)
        {
            foreach (var ft in food.FoodFoodTags)
            {
                var tagName = ft.Tag.Name;
                if (!tagCounts.ContainsKey(tagName))
                    tagCounts[tagName] = 0;
                tagCounts[tagName]++;
            }
        }

        return tagCounts;
    }

    public async Task<IEnumerable<FoodResponseDto>> GetWheelFoodsAsync(string? category, int count = 8)
    {
        try
        {
            var foods = await foodRepository.GetAllWithIncludesAsync("FoodFoodTags.Tag");
            foods = ApplyCategoryFilter(foods, category).ToList();
            
            foods = foods.Where(f => f.IsActive).ToList();
            if (!foods.Any()) return new List<FoodResponseDto>();
            
            var random = new Random();
            var shuffled = foods.OrderBy(x => random.Next()).Take(count).ToList();
            
            return shuffled.Select(MapToDto);
        }
        catch (Exception ex)
        {
            throw new ApplicationException($"Error retrieving wheel foods: {ex.Message}", ex);
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

    private static IEnumerable<Food> ApplyCategoryFilter(IEnumerable<Food> foods, string? category)
    {
        if (string.IsNullOrWhiteSpace(category) || category.Equals("all", StringComparison.OrdinalIgnoreCase))
            return foods;

        if (category.Equals("kho", StringComparison.OrdinalIgnoreCase))
            return foods.Where(f => f.Category == FoodCategory.Kho);

        if (category.Equals("nuoc", StringComparison.OrdinalIgnoreCase))
            return foods.Where(f => f.Category == FoodCategory.Nuoc);

        if (category.Equals("an_vat", StringComparison.OrdinalIgnoreCase) || 
            category.Equals("anvat", StringComparison.OrdinalIgnoreCase))
        {
            var snackNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Bánh Tráng Trộn", "Bánh Tráng Nướng", "Bánh Khọt", "Bánh Bèo", "Bánh Xèo", "Chả Giò (Nem Rán)", 
                "Bún Đậu Mắm Tôm", "Nem Nướng", "Bánh Mì Thịt", "Chè Khúc Bạch", "Chè Đậu Đen"
            };
            return foods.Where(f => snackNames.Contains(f.Name) ||
                f.FoodFoodTags.Any(ft => 
                    ft.Tag.Name.Equals("Chiên", StringComparison.OrdinalIgnoreCase) ||
                    ft.Tag.Name.Equals("Ngọt", StringComparison.OrdinalIgnoreCase) ||
                    ft.Tag.Name.Equals("Đồ Uống", StringComparison.OrdinalIgnoreCase)
                ) || f.AvgPriceRange == PriceRange.Re);
        }

        if (category.Equals("healthy", StringComparison.OrdinalIgnoreCase) || 
            category.Equals("chay", StringComparison.OrdinalIgnoreCase))
        {
            var meatWords = new[] { "thịt", "bò", "gà", "heo", "lợn", "cá", "lươn", "cua", "ốc", "tôm", "mực", "sườn", "mắm", "lòng" };
            return foods.Where(f => 
                !f.FoodFoodTags.Any(ft => 
                    ft.Tag.Name.Equals("Thịt", StringComparison.OrdinalIgnoreCase) ||
                    ft.Tag.Name.Equals("Hải Sản", StringComparison.OrdinalIgnoreCase) ||
                    ft.Tag.Name.Equals("Mặn", StringComparison.OrdinalIgnoreCase)
                ) &&
                (
                    f.Name.Contains("Chay", StringComparison.OrdinalIgnoreCase) ||
                    (
                        !meatWords.Any(w => f.Name.Contains(w, StringComparison.OrdinalIgnoreCase)) &&
                        (
                            f.FoodFoodTags.Any(ft => 
                                ft.Tag.Name.Equals("Chay", StringComparison.OrdinalIgnoreCase) ||
                                ft.Tag.Name.Equals("Healthy", StringComparison.OrdinalIgnoreCase) ||
                                ft.Tag.Name.Equals("Rau", StringComparison.OrdinalIgnoreCase)
                            ) ||
                            f.Name.Contains("Salad", StringComparison.OrdinalIgnoreCase) ||
                            f.Name.Contains("Nấm", StringComparison.OrdinalIgnoreCase)
                        )
                    )
                )
            );
        }

        if (Enum.TryParse<FoodCategory>(category, true, out var categoryEnum))
        {
            return foods.Where(f => f.Category == categoryEnum);
        }

        return foods;
    }
}
