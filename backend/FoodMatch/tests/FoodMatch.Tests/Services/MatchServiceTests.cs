using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using FoodMatch.Application.DTOs.Match;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.Services;
using FoodMatch.Domain.Entities;
using FoodMatch.Domain.Enums;
using Moq;
using Xunit;

namespace FoodMatch.Tests.Services;

/// <summary>
/// Unit tests for MatchService.
/// </summary>
public class MatchServiceTests
{
    private readonly Mock<IRepository<MatchRequest>> _mockMatchRepo;
    private readonly Mock<IRepository<TempUser>> _mockUserRepo;
    private readonly MatchService _service;

    public MatchServiceTests()
    {
        _mockMatchRepo = new Mock<IRepository<MatchRequest>>();
        _mockUserRepo = new Mock<IRepository<TempUser>>();
        _service = new MatchService(_mockMatchRepo.Object, _mockUserRepo.Object);
    }

    [Fact]
    public async Task SendRequest_CreatesRequest()
    {
        // Arrange
        var fromUser = Guid.NewGuid();
        var toUser = Guid.NewGuid();
        _mockUserRepo.Setup(r => r.GetByIdAsync(fromUser)).ReturnsAsync(new TempUser { Id = fromUser, DisplayName = "Alice" });
        _mockUserRepo.Setup(r => r.GetByIdAsync(toUser)).ReturnsAsync(new TempUser { Id = toUser, DisplayName = "Bob" });
        
        _mockMatchRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<MatchRequest, bool>>>()))
            .ReturnsAsync(new List<MatchRequest>());

        var dto = new CreateMatchRequestDto { ToTempUserId = toUser };

        // Act
        var result = await _service.SendMatchRequestAsync(fromUser, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(fromUser, result.FromUserId);
        Assert.Equal(toUser, result.ToUserId);
        Assert.Equal("Pending", result.Status);
        _mockMatchRepo.Verify(r => r.AddAsync(It.IsAny<MatchRequest>()), Times.Once);
    }

    [Fact]
    public async Task RespondAccept_UpdatesStatus()
    {
        // Arrange
        var requestId = 1;
        var req = new MatchRequest { Id = requestId, FromTempUserId = Guid.NewGuid(), ToTempUserId = Guid.NewGuid(), Status = MatchStatus.Pending };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(requestId)).ReturnsAsync(req);

        // Act
        var result = await _service.RespondToRequestAsync(requestId, true);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Accepted", result.Status);
        _mockMatchRepo.Verify(r => r.UpdateAsync(It.Is<MatchRequest>(m => m.Status == MatchStatus.Accepted)), Times.Once);
    }

    [Fact]
    public async Task GetPending_ReturnsOnlyPending()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var pendingRequests = new List<MatchRequest>
        {
            new MatchRequest { Id = 1, ToTempUserId = userId, Status = MatchStatus.Pending }
        };
        _mockMatchRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<MatchRequest, bool>>>()))
            .ReturnsAsync(pendingRequests);

        // Act
        var result = await _service.GetPendingRequestsAsync(userId);

        // Assert
        Assert.Single(result);
        Assert.Equal("Pending", result[0].Status);
    }
}
