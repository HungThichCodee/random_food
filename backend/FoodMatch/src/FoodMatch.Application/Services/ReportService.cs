using FoodMatch.Application.DTOs.Report;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;

namespace FoodMatch.Application.Services;

public class ReportService : IReportService
{
    private readonly IRepository<UserReport> _reportRepository;
    private readonly IRepository<TempUser> _userRepository;

    public ReportService(
        IRepository<UserReport> reportRepository,
        IRepository<TempUser> userRepository)
    {
        _reportRepository = reportRepository;
        _userRepository = userRepository;
    }

    public async Task<UserReportDto> ReportUserAsync(Guid reporterUserId, CreateReportDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Reason))
                throw new ArgumentException("Reason is required.");

            if (reporterUserId == dto.ReportedTempUserId)
                throw new ArgumentException("Cannot report yourself.");

            var reporter = await _userRepository.GetByIdAsync(reporterUserId);
            if (reporter == null)
                throw new KeyNotFoundException("Reporter not found.");

            var reported = await _userRepository.GetByIdAsync(dto.ReportedTempUserId);
            if (reported == null)
                throw new KeyNotFoundException("Reported user not found.");

            var report = new UserReport
            {
                ReporterTempUserId = reporterUserId,
                ReportedTempUserId = dto.ReportedTempUserId,
                Reason = dto.Reason,
                Details = dto.Details,
                CreatedAt = DateTime.UtcNow
            };

            await _reportRepository.AddAsync(report);
            
            // Note: In a real production environment we might automatically suspend users with multiple reports.
            // For now, we just record it.

            return new UserReportDto
            {
                Id = report.Id,
                ReporterUserId = report.ReporterTempUserId,
                ReportedUserId = report.ReportedTempUserId,
                Reason = report.Reason,
                CreatedAt = report.CreatedAt
            };
        }
        catch
        {
            throw;
        }
    }
}
