using Microsoft.AspNetCore.Mvc;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Routing;

namespace FoodMatch.Api.Controllers;

/// <summary>
/// API controller for route calculation and navigation directions.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class RoutingController : ControllerBase
{
    private readonly IRoutingService _routingService;

    public RoutingController(IRoutingService routingService)
    {
        _routingService = routingService;
    }

    [HttpGet("directions")]
    public async Task<ActionResult<RouteDto?>> GetDirections([FromQuery] double fromLat, [FromQuery] double fromLng, [FromQuery] double toLat, [FromQuery] double toLng)
    {
        // TODO: Call _routingService.GetRouteAsync
        throw new NotImplementedException();
    }
}
