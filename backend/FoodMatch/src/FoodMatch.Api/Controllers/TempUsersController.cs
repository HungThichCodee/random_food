using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.TempUser;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace FoodMatch.Api.Controllers;

/// <summary>
/// API controller for temporary user sessions and location updates.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("GeneralApi")]
public class TempUsersController : ControllerBase
{
    private readonly ITempUserService _tempUserService;
    private readonly FoodMatch.Api.Services.IJwtTokenGenerator _jwtTokenGenerator;
    private readonly FoodMatch.Api.Services.ICaptchaVerifier _captchaVerifier;

    public TempUsersController(ITempUserService tempUserService, FoodMatch.Api.Services.IJwtTokenGenerator jwtTokenGenerator,
        FoodMatch.Api.Services.ICaptchaVerifier captchaVerifier)
    {
        _tempUserService = tempUserService;
        _jwtTokenGenerator = jwtTokenGenerator;
        _captchaVerifier = captchaVerifier;
    }

    [HttpPost]
    [AllowAnonymous]
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

            if (!await _captchaVerifier.VerifyAsync(dto.CaptchaToken, HttpContext.RequestAborted))
                return BadRequest(new { Message = "Captcha verification failed." });

            var result = await _tempUserService.CreateTempUserAsync(dto);
            result.Token = _jwtTokenGenerator.GenerateToken(result);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (HttpRequestException)
        {
            return StatusCode(503, new { Message = "Captcha verification is temporarily unavailable." });
        }
        catch (TaskCanceledException)
        {
            return StatusCode(503, new { Message = "Captcha verification timed out." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An internal error occurred." });
        }
    }

    [HttpPut("{id}/location")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] UpdateLocationDto dto)
    {
        if (User.FindFirstValue(ClaimTypes.NameIdentifier) != id.ToString()) return Forbid();
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

            if (!dto.Lat.HasValue || !dto.Lng.HasValue)
                return BadRequest(new { Message = "Latitude and longitude are required." });
            await _tempUserService.UpdateLocationAsync(id, dto.Lat.Value, dto.Lng.Value);
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
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An internal error occurred." });
        }
    }

    [HttpGet("nearby")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<List<NearbyUserDto>>> GetNearby()
    {
        try
        {
            if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var currentUserId)) return Unauthorized();
            var caller = await _tempUserService.GetByIdAsync(currentUserId);
            if (caller?.CurrentLat == null || caller.CurrentLng == null)
                return Conflict(new { Message = "Update your location first." });
            var result = await _tempUserService.GetNearbyUsersAsync(caller.CurrentLat.Value, caller.CurrentLng.Value);
            return Ok(result.Where(u => u.Id != currentUserId));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An internal error occurred." });
        }
    }

    [HttpPut("{id}/visibility")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<IActionResult> SetVisibility(Guid id, [FromBody] bool visible)
    {
        if (User.FindFirstValue(ClaimTypes.NameIdentifier) != id.ToString()) return Forbid();
        try
        {
            await _tempUserService.SetLocationVisibilityAsync(id, visible);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An internal error occurred." });
        }
    }
}
