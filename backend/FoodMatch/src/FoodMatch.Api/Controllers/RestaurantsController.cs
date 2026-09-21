using Microsoft.AspNetCore.Mvc;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Restaurant;

namespace FoodMatch.Api.Controllers;

/// <summary>
/// API controller for nearby restaurants and mall buffet searches.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class RestaurantsController : ControllerBase
{
    private readonly IRestaurantService _restaurantService;

    public RestaurantsController(IRestaurantService restaurantService)
    {
        _restaurantService = restaurantService;
    }

    [HttpGet("nearby")]
    public async Task<ActionResult<List<RestaurantDto>>> GetNearby([FromQuery] double lat, [FromQuery] double lng, [FromQuery] double radiusKm = 3.0)
    {
        // TODO: Call _restaurantService.GetNearbyRestaurantsAsync
        throw new NotImplementedException();
    }

    [HttpGet("buffet-mall")]
    public async Task<ActionResult<List<RestaurantDto>>> GetBuffetMall([FromQuery] double lat, [FromQuery] double lng)
    {
        // TODO: Call _restaurantService.GetBuffetInMallAsync
        throw new NotImplementedException();
    }

    [HttpGet("random-nearby")]
    public async Task<ActionResult<RestaurantDto?>> GetRandomNearby([FromQuery] double lat, [FromQuery] double lng, [FromQuery] double radiusKm = 3.0)
    {
        // TODO: Call _restaurantService.GetRandomNearbyRestaurantAsync
        throw new NotImplementedException();
    }
}
