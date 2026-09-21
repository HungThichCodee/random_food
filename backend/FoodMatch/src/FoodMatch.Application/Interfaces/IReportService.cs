using FoodMatch.Application.DTOs.Report;

namespace FoodMatch.Application.Interfaces;

/// <summary>
/// Service interface for processing and managing user incident reports.
/// </summary>
public interface IReportService
{
    Task<UserReportDto> ReportUserAsync(Guid reporterUserId, CreateReportDto dto);
}
