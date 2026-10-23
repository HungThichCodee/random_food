using FoodMatch.Application.DTOs.Report;
using FoodMatch.Application.Interfaces;
using FoodMatch.Domain.Entities;
using FoodMatch.Domain.Enums;

namespace FoodMatch.Application.Services;

public class ReportService : IReportService
{
    private readonly IRepository<UserReport> _reportRepository;
    private readonly IRepository<TempUser> _userRepository;
    private readonly IRepository<MatchRequest> _matchRepository;

    public ReportService(
        IRepository<UserReport> reportRepository,
        IRepository<TempUser> userRepository,
        IRepository<MatchRequest> matchRepository)
    {
        _reportRepository = reportRepository;
        _userRepository = userRepository;
        _matchRepository = matchRepository;
    }

    public async Task<UserReportDto> ReportUserAsync(Guid reporterUserId, CreateReportDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Reason) || dto.Reason.Length > 200 ||
            dto.Details?.Length > 1000 || dto.ReportedTempUserId == Guid.Empty)
            throw new ArgumentException("Invalid report.");

        if (reporterUserId == dto.ReportedTempUserId)
            throw new ArgumentException("Cannot report yourself.");

        var reporter = await _userRepository.GetByIdAsync(reporterUserId);
        if (reporter == null || reporter.ExpiresAt <= DateTime.UtcNow)
            throw new KeyNotFoundException("Reporter not found.");

        var reported = await _userRepository.GetByIdAsync(dto.ReportedTempUserId);
        if (reported == null || reported.ExpiresAt <= DateTime.UtcNow)
            throw new KeyNotFoundException("Reported user not found.");

        var activeMatches = await _matchRepository.FindAsync(match =>
            match.Status == MatchStatus.Accepted &&
            ((match.FromTempUserId == reporterUserId &&
              match.ToTempUserId == dto.ReportedTempUserId) ||
             (match.ToTempUserId == reporterUserId &&
              match.FromTempUserId == dto.ReportedTempUserId)));
        if (!activeMatches.Any())
            throw new UnauthorizedAccessException("Report target is not in your active match.");

        var report = new UserReport
        {
            ReporterTempUserId = reporterUserId,
            ReportedTempUserId = dto.ReportedTempUserId,
            Reason = dto.Reason.Trim(),
            Details = dto.Details,
            CreatedAt = DateTime.UtcNow
        };

        await _reportRepository.AddAsync(report);

        return new UserReportDto
        {
            Id = report.Id,
            ReporterUserId = report.ReporterTempUserId,
            ReportedUserId = report.ReportedTempUserId,
            Reason = report.Reason,
            CreatedAt = report.CreatedAt
        };
    }
}
