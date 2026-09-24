using Microsoft.AspNetCore.Mvc;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Food;
using System.ComponentModel.DataAnnotations;

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
    public async Task<ActionResult<FoodResponseDto>> GetRandomFood([FromQuery] FoodRandomRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            FoodResponseDto result;
            if (!string.IsNullOrWhiteSpace(request.Category))
            {
                result = await _foodService.GetRandomByCategoryAsync(request.Category, request.SessionId);
            }
            else
            {
                result = await _foodService.GetRandomFoodAsync(request.SessionId);
            }
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = $"Internal server error while fetching random food: {ex.Message}" });
        }
    }

    [HttpPost("suggest")]
    public async Task<ActionResult<FoodResponseDto>> SuggestFoods([FromBody] FoodSuggestRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _foodService.SuggestFoodsAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = $"Internal server error while suggesting foods: {ex.Message}" });
        }
    }
}
