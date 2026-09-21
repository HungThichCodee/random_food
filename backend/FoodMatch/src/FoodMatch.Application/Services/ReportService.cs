namespace FoodMatch.Application.Services;

using FoodMatch.Application.DTOs.Report;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;

/// <summary>
/// Service implementation for reporting user misconduct.
/// </summary>
public class ReportService(
    IRepository<UserReport> userReportRepository) : IReportService
{
    public Task<UserReportDto> ReportUserAsync(Guid reporterUserId, CreateReportDto dto)
    {
        throw new NotImplementedException(); // TODO: Implement in Phase 4
    }
}
