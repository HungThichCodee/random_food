using Microsoft.AspNetCore.Mvc;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Report;

namespace FoodMatch.Api.Controllers;

/// <summary>
/// API controller for reporting inappropriate behavior.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpPost]
    public async Task<ActionResult<UserReportDto>> Create([FromHeader(Name = "X-User-Id")] Guid reporterUserId, [FromBody] CreateReportDto dto)
    {
        // TODO: Call _reportService.ReportUserAsync
        throw new NotImplementedException();
    }
}
