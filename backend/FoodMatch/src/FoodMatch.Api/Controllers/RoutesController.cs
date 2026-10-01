using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Routing;

namespace FoodMatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoutesController : ControllerBase
{
    private readonly IRoutingService _routingService;

    public RoutesController(IRoutingService routingService)
    {
        _routingService = routingService;
    }

    [HttpGet]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<RouteDto>> GetRoute([FromQuery] double fromLat, [FromQuery] double fromLng, [FromQuery] double toLat, [FromQuery] double toLng)
    {
        try
        {
            // Validation
            if (fromLat < -90 || fromLat > 90 || toLat < -90 || toLat > 90)
                return BadRequest("Invalid latitude.");
            if (fromLng < -180 || fromLng > 180 || toLng < -180 || toLng > 180)
                return BadRequest("Invalid longitude.");

            var route = await _routingService.GetRouteAsync(fromLat, fromLng, toLat, toLng);
            if (route == null)
            {
                return BadRequest("Could not calculate route.");
            }
            return Ok(route);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error getting route: {ex.Message}");
        }
    }
}
