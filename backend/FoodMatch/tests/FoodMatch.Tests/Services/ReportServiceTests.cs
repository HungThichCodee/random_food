using System.Linq.Expressions;
using FoodMatch.Application.DTOs.Report;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.Services;
using FoodMatch.Domain.Entities;
using FoodMatch.Domain.Enums;
using Moq;
using Xunit;

namespace FoodMatch.Tests.Services;

public class ReportServiceTests
{
    [Fact]
    public async Task ReportRequiresAcceptedMatchWithTarget()
    {
        var reporter = new TempUser { Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1) };
        var target = new TempUser { Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1) };
        var unrelated = new TempUser { Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1) };
        var users = new Mock<IRepository<TempUser>>();
        users.Setup(repo => repo.GetByIdAsync(reporter.Id)).ReturnsAsync(reporter);
        users.Setup(repo => repo.GetByIdAsync(target.Id)).ReturnsAsync(target);
        users.Setup(repo => repo.GetByIdAsync(unrelated.Id)).ReturnsAsync(unrelated);
        var matchList = new List<MatchRequest>
        {
            new() { FromTempUserId = reporter.Id, ToTempUserId = target.Id,
                Status = MatchStatus.Accepted }
        };
        var matches = new Mock<IRepository<MatchRequest>>();
        matches.Setup(repo => repo.FindAsync(It.IsAny<Expression<Func<MatchRequest, bool>>>()))
            .ReturnsAsync((Expression<Func<MatchRequest, bool>> predicate) =>
                matchList.Where(predicate.Compile()).ToList());
        var reports = new Mock<IRepository<UserReport>>();
        var service = new ReportService(reports.Object, users.Object, matches.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.ReportUserAsync(reporter.Id,
                new CreateReportDto { ReportedTempUserId = unrelated.Id, Reason = "Spam" }));
        reports.Verify(repo => repo.AddAsync(It.IsAny<UserReport>()), Times.Never);

        var accepted = await service.ReportUserAsync(reporter.Id,
            new CreateReportDto { ReportedTempUserId = target.Id, Reason = "Spam" });
        Assert.Equal(target.Id, accepted.ReportedUserId);
        reports.Verify(repo => repo.AddAsync(It.Is<UserReport>(report =>
            report.ReporterTempUserId == reporter.Id &&
            report.ReportedTempUserId == target.Id)), Times.Once);
    }
}
