using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Restaurant;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace FoodMatch.Api.Controllers
{
    /// <summary>
    /// API controller for nearby restaurants and mall buffet searches.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("GeneralApi")]
    public class RestaurantsController : ControllerBase
    {
        private readonly IRestaurantService _restaurantService;

        public RestaurantsController(IRestaurantService restaurantService)
        {
            _restaurantService = restaurantService;
        }

        [HttpGet("nearby")]
        public async Task<ActionResult<List<RestaurantResponseDto>>> GetNearby([FromQuery] NearbyRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _restaurantService.GetNearbyAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = ex.Message });
            }
        }

        [HttpGet("buffet-mall")]
        public async Task<ActionResult<List<RestaurantResponseDto>>> GetBuffetMall([FromQuery] NearbyRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _restaurantService.GetBuffetInMallAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = ex.Message });
            }
        }
    }
}
