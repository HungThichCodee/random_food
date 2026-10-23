using Microsoft.AspNetCore.Mvc;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Food;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.RateLimiting;

namespace FoodMatch.Api.Controllers;

/// <summary>
/// API controller for food items, random picks, and recommendations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("GeneralApi")]
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
        catch (KeyNotFoundException)
        {
            return NotFound(new { Error = "No food is available for this filter." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Error = "An internal error occurred." });
        }
    }

    [HttpGet("wheel")]
    public async Task<ActionResult<IEnumerable<FoodResponseDto>>> GetWheelFoods([FromQuery] string? category, [FromQuery] int? count = null)
    {
        try
        {
            var result = await _foodService.GetWheelFoodsAsync(category, count);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Error = "An internal error occurred." });
        }
    }

    [HttpPost("suggest")]
    public async Task<ActionResult<SuggestResponseDto>> SuggestFoods([FromBody] FoodSuggestRequestDto request)
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
        catch (Exception)
        {
            return StatusCode(500, new { Error = "An internal error occurred." });
        }
    }

    [HttpPost("tags-count")]
    public async Task<ActionResult<Dictionary<string, int>>> GetTagCounts([FromBody] FoodSuggestRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tagCounts = await _foodService.GetTagCountsAsync(request);
            return Ok(tagCounts);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Error = "An internal error occurred." });
        }
    }
}
