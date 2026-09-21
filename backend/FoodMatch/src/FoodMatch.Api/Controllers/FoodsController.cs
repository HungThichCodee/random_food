using Microsoft.AspNetCore.Mvc;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Food;

namespace FoodMatch.Api.Controllers;

/// <summary>
/// API controller for food items, random picks, and recommendations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class FoodsController : ControllerBase
{
    private readonly IFoodService _foodService;

    public FoodsController(IFoodService foodService)
    {
        _foodService = foodService;
    }

    [HttpGet("random")]
    public async Task<ActionResult<FoodDto>> GetRandomFood([FromQuery] string? category = null)
    {
        // TODO: Call _foodService.GetRandomFoodAsync or GetRandomFoodByCategoryAsync
        throw new NotImplementedException();
    }

    [HttpPost("suggest")]
    public async Task<ActionResult<List<FoodDto>>> SuggestByCriteria([FromBody] FoodCriteriaDto criteria)
    {
        // TODO: Call _foodService.SuggestByCriteriaAsync
        throw new NotImplementedException();
    }

    [HttpGet("tags")]
    public async Task<ActionResult<List<string>>> GetAllTags()
    {
        // TODO: Call _foodService.GetAllTagsAsync
        throw new NotImplementedException();
    }
}
