using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FoodMatch.Application.DTOs.Food;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.Services;
using FoodMatch.Domain.Entities;
using FoodMatch.Domain.Enums;
using Moq;
using Xunit;

namespace FoodMatch.Tests.Services;

/// <summary>
/// Unit tests for FoodService.
/// </summary>
public class FoodServiceTests
{
    private readonly Mock<IRepository<Food>> _mockFoodRepo;
    private readonly Mock<IRepository<FoodSuggestionLog>> _mockSuggestionRepo;
    private readonly Mock<IRepository<TempUser>> _mockUserRepo;
    private readonly FoodService _service;

    public FoodServiceTests()
    {
        _mockFoodRepo = new Mock<IRepository<Food>>();
        _mockSuggestionRepo = new Mock<IRepository<FoodSuggestionLog>>();
        _mockUserRepo = new Mock<IRepository<TempUser>>();
        _service = new FoodService(_mockFoodRepo.Object, _mockSuggestionRepo.Object, _mockUserRepo.Object);
    }

    private List<Food> GetSampleFoods()
    {
        return new List<Food>
        {
            new Food { Id = 1, Name = "Phở", Category = FoodCategory.Nuoc, IsActive = true, FoodFoodTags = new List<FoodFoodTag>() },
            new Food { Id = 2, Name = "Cơm Tấm", Category = FoodCategory.Kho, IsActive = true, FoodFoodTags = new List<FoodFoodTag>() }
        };
    }

    [Fact]
    public async Task RandomFood_ReturnsFood()
    {
        // Arrange
        _mockFoodRepo.Setup(r => r.GetAllWithIncludesAsync(It.IsAny<string>()))
            .ReturnsAsync(GetSampleFoods());

        // Act
        var result = await _service.GetRandomFoodAsync("test-session");

        // Assert
        Assert.NotNull(result);
        Assert.Contains(result.Name, new[] { "Phở", "Cơm Tấm" });
    }

    [Fact]
    public async Task RandomFoodByCategory_FiltersCorrectly()
    {
        // Arrange
        _mockFoodRepo.Setup(r => r.GetAllWithIncludesAsync(It.IsAny<string>()))
            .ReturnsAsync(GetSampleFoods());

        // Act
        var result = await _service.GetRandomByCategoryAsync("Kho", "test-session");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Cơm Tấm", result.Name);
    }

    [Fact]
    public async Task SuggestByCriteria_ReturnsFilteredResults()
    {
        // Arrange
        var foods = GetSampleFoods();
        foods[0].MealTime = MealTime.Sang;
        foods[1].MealTime = MealTime.Trua;
        _mockFoodRepo.Setup(r => r.GetAllWithIncludesAsync(It.IsAny<string>()))
            .ReturnsAsync(foods);

        var request = new FoodSuggestRequestDto { SessionId = "test", MealTimes = new List<string> { "Trua" } };

        // Act
        var result = await _service.SuggestFoodsAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Items);
        Assert.Equal("Cơm Tấm", result.Items.First().Name);
    }
}
