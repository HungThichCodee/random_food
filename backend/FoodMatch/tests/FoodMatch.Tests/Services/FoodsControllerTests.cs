using FoodMatch.Api.Controllers;
using FoodMatch.Application.DTOs.Food;
using FoodMatch.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FoodMatch.Tests.Services;

public class FoodsControllerTests
{
    [Fact]
    public async Task RandomFoodWithNoAvailableDishReturns404()
    {
        var request = new FoodRandomRequestDto { Category = "Kho", SessionId = "test-session" };
        var service = new Mock<IFoodService>();
        service.Setup(value => value.GetRandomByCategoryAsync("Kho", "test-session"))
            .ThrowsAsync(new KeyNotFoundException());
        var controller = new FoodsController(service.Object);

        var response = await controller.GetRandomFood(request);

        Assert.IsType<NotFoundObjectResult>(response.Result);
    }

    [Fact]
    public async Task InvalidTagCountFilterReturnsBadRequest()
    {
        var request = new FoodSuggestRequestDto { SessionId = "test-session" };
        var service = new Mock<IFoodService>();
        service.Setup(value => value.GetTagCountsAsync(request))
            .ThrowsAsync(new ArgumentException("Invalid food filter."));
        var controller = new FoodsController(service.Object);

        var response = await controller.GetTagCounts(request);

        Assert.IsType<BadRequestObjectResult>(response.Result);
    }
}
