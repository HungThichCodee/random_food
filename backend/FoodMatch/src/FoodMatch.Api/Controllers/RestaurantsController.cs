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
            try
            {
                if (request == null)
                {
                    return BadRequest(new { Message = "Request data cannot be null." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Strict validation check
                if (request.Latitude < -90 || request.Latitude > 90)
                {
                    return BadRequest(new { Message = "Latitude is invalid. Must be between -90 and 90." });
                }

                if (request.Longitude < -180 || request.Longitude > 180)
                {
                    return BadRequest(new { Message = "Longitude is invalid. Must be between -180 and 180." });
                }

                var result = await _restaurantService.GetNearbyAsync(request);
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

        [HttpGet("buffet-mall")]
        public async Task<ActionResult<List<RestaurantResponseDto>>> GetBuffetMall([FromQuery] NearbyRequestDto request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { Message = "Request data cannot be null." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (request.Latitude < -90 || request.Latitude > 90)
                {
                    return BadRequest(new { Message = "Latitude is invalid. Must be between -90 and 90." });
                }

                if (request.Longitude < -180 || request.Longitude > 180)
                {
                    return BadRequest(new { Message = "Longitude is invalid. Must be between -180 and 180." });
                }

                var result = await _restaurantService.GetBuffetInMallAsync(request);
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
    }
}
