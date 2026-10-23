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
    private readonly FoodService _service;

    public FoodServiceTests()
    {
        _mockFoodRepo = new Mock<IRepository<Food>>();
        _service = new FoodService(_mockFoodRepo.Object);
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
    public async Task RandomFoodByCategory_WithNoActiveFoodReturnsNotFoundCondition()
    {
        _mockFoodRepo.Setup(r => r.GetAllWithIncludesAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<Food>
            {
                new() { Id = 1, Name = "Món đã ẩn", Category = FoodCategory.Kho,
                    IsActive = false, FoodFoodTags = new List<FoodFoodTag>() }
            });

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.GetRandomByCategoryAsync("Kho", "test-session"));
    }

    [Fact]
    public async Task OversizedFoodFiltersAreRejectedBeforeLoadingFoods()
    {
        var request = new FoodSuggestRequestDto
        {
            SessionId = "test-session",
            IncludedTags = Enumerable.Repeat("tag", 21).ToList()
        };

        await Assert.ThrowsAsync<ArgumentException>(() => _service.SuggestFoodsAsync(request));
        await Assert.ThrowsAsync<ArgumentException>(() => _service.GetTagCountsAsync(request));
        await Assert.ThrowsAsync<ArgumentException>(() => _service.GetWheelFoodsAsync(null, 101));
        _mockFoodRepo.Verify(r => r.GetAllWithIncludesAsync(It.IsAny<string>()), Times.Never);
    }

    [Theory]
    [InlineData("man", "Mặn", "Cơm Tấm")]
    [InlineData("chay", "Chay", "Cơm Chay")]
    [InlineData("ngot", "Ngọt", "Chè Đậu")]
    public async Task RouletteFilters_UseTheSameTaggedFoodsForCardsAndWinner(string category, string tagName, string expectedName)
    {
        var foods = new List<Food>
        {
            TaggedFood(1, "Cơm Tấm", "Mặn"),
            TaggedFood(2, "Cơm Chay", "Chay"),
            TaggedFood(3, "Chè Đậu", "Ngọt")
        };
        _mockFoodRepo.Setup(r => r.GetAllWithIncludesAsync(It.IsAny<string>())).ReturnsAsync(foods);

        var cards = (await _service.GetWheelFoodsAsync(category, 8)).ToList();
        var winner = await _service.GetRandomByCategoryAsync(category, "test-session");

        Assert.Single(cards);
        Assert.Equal(expectedName, cards[0].Name);
        Assert.Equal(expectedName, winner.Name);
        Assert.Contains(tagName, winner.Tags);
    }

    [Fact]
    public async Task WheelWithoutCount_ReturnsEveryActiveFoodAndImageUrl()
    {
        var foods = Enumerable.Range(1, 12)
            .Select(id => TaggedFood(id, $"Món {id}", "Mặn"))
            .ToList();
        foods[0].ImageUrl = "https://example.com/mon-1.jpg";
        foods.Add(new Food { Id = 13, Name = "Ẩn", IsActive = false, FoodFoodTags = new List<FoodFoodTag>() });
        _mockFoodRepo.Setup(r => r.GetAllWithIncludesAsync(It.IsAny<string>())).ReturnsAsync(foods);

        var cards = (await _service.GetWheelFoodsAsync(null)).ToList();

        Assert.Equal(12, cards.Count);
        Assert.Equal("https://example.com/mon-1.jpg", cards.Single(f => f.Id == 1).ImageUrl);
    }

    [Fact]
    public async Task RouletteFilters_KeepMixedTagsInOneGroup()
    {
        var foods = new List<Food>
        {
            TaggedFood(1, "Món mặn", "Mặn"),
            TaggedFood(2, "Xôi chay", "Mặn", "Chay"),
            TaggedFood(3, "Chè chay", "Chay", "Ngọt"),
            TaggedFood(4, "Gỏi cuốn", "Thịt", "Hải Sản")
        };
        _mockFoodRepo.Setup(r => r.GetAllWithIncludesAsync(It.IsAny<string>())).ReturnsAsync(foods);

        var savory = (await _service.GetWheelFoodsAsync("man")).ToList();
        var vegetarian = (await _service.GetWheelFoodsAsync("chay")).ToList();
        var sweet = (await _service.GetWheelFoodsAsync("ngot")).ToList();

        Assert.Equal(new[] { 1, 4 }, savory.Select(food => food.Id).OrderBy(id => id));
        Assert.Equal(new[] { 2 }, vegetarian.Select(food => food.Id));
        Assert.Equal(new[] { 3 }, sweet.Select(food => food.Id));
        Assert.Contains((await _service.GetRandomByCategoryAsync("man", "test-session")).Id, new[] { 1, 4 });
    }

    private static Food TaggedFood(int id, string name, params string[] tagNames) => new()
    {
        Id = id,
        Name = name,
        Category = FoodCategory.Kho,
        IsActive = true,
        FoodFoodTags = tagNames.Select(tagName => new FoodFoodTag { Tag = new FoodTag { Name = tagName } }).ToList()
    };

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
