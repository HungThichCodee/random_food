using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Report;
using System.Security.Claims;

namespace FoodMatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpPost]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("ReportApi")]
    public async Task<ActionResult<UserReportDto>> ReportUser([FromBody] CreateReportDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var reporterId))
            {
                return Unauthorized("Invalid user token.");
            }

            var report = await _reportService.ReportUserAsync(reporterId, dto);
            return Ok(report);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception)
        {
            return StatusCode(500, "An internal error occurred.");
        }
    }
}
