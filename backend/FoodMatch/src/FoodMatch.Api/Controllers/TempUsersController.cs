using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.TempUser;

namespace FoodMatch.Api.Controllers;

/// <summary>
/// API controller for temporary user sessions and location updates.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TempUsersController : ControllerBase
{
    private readonly ITempUserService _tempUserService;
    private readonly FoodMatch.Api.Services.IJwtTokenGenerator _jwtTokenGenerator;

    public TempUsersController(ITempUserService tempUserService, FoodMatch.Api.Services.IJwtTokenGenerator jwtTokenGenerator)
    {
        _tempUserService = tempUserService;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    [HttpPost]
    [EnableRateLimiting("CreateProfile")]
    public async Task<ActionResult<TempUserDto>> Create([FromBody] CreateTempUserDto dto)
    {
        try
        {
            if (dto == null)
            {
                return BadRequest(new { Message = "Request cannot be null." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _tempUserService.CreateTempUserAsync(dto);
            result.Token = _jwtTokenGenerator.GenerateToken(result);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An internal error occurred.", Detailed = ex.Message });
        }
    }

    [HttpPut("{id}/location")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] UpdateLocationDto dto)
    {
        try
        {
            if (dto == null)
            {
                return BadRequest(new { Message = "Request cannot be null." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _tempUserService.UpdateLocationAsync(id, dto.Lat, dto.Lng);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An internal error occurred.", Detailed = ex.Message });
        }
    }

    [HttpGet("nearby")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<List<TempUserDto>>> GetNearby([FromQuery] double lat, [FromQuery] double lng, [FromQuery] double radiusKm = 3.0)
    {
        try
        {
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
            {
                return BadRequest(new { Message = "Invalid coordinates." });
            }

            var result = await _tempUserService.GetNearbyUsersAsync(lat, lng, radiusKm);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An internal error occurred.", Detailed = ex.Message });
        }
    }

    [HttpPut("{id}/visibility")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<IActionResult> SetVisibility(Guid id, [FromBody] bool visible)
    {
        try
        {
            await _tempUserService.SetLocationVisibilityAsync(id, visible);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An internal error occurred.", Detailed = ex.Message });
        }
    }
}
