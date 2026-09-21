using Microsoft.AspNetCore.Mvc;
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

    public TempUsersController(ITempUserService tempUserService)
    {
        _tempUserService = tempUserService;
    }

    [HttpPost]
    public async Task<ActionResult<TempUserDto>> Create([FromBody] CreateTempUserDto dto)
    {
        // TODO: Call _tempUserService.CreateTempUserAsync
        throw new NotImplementedException();
    }

    [HttpPut("{id}/location")]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] UpdateLocationDto dto)
    {
        // TODO: Call _tempUserService.UpdateLocationAsync
        throw new NotImplementedException();
    }

    [HttpGet("nearby")]
    public async Task<ActionResult<List<TempUserDto>>> GetNearby([FromQuery] double lat, [FromQuery] double lng, [FromQuery] double radiusKm = 3.0)
    {
        // TODO: Call _tempUserService.GetNearbyUsersAsync
        throw new NotImplementedException();
    }

    [HttpPut("{id}/visibility")]
    public async Task<IActionResult> SetVisibility(Guid id, [FromBody] bool visible)
    {
        // TODO: Call _tempUserService.SetLocationVisibilityAsync
        throw new NotImplementedException();
    }
}
