using Microsoft.AspNetCore.Mvc;

namespace FoodMatch.Api.Controllers;

/// <summary>
/// Health check endpoint for system monitoring.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new { status = "Healthy", timestamp = DateTime.UtcNow });
    }
}
