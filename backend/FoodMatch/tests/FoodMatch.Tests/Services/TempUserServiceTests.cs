using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using FoodMatch.Application.DTOs.TempUser;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.Services;
using FoodMatch.Domain.Entities;
using Moq;
using Xunit;

namespace FoodMatch.Tests.Services;

/// <summary>
/// Unit tests for TempUserService.
/// </summary>
public class TempUserServiceTests
{
    private readonly Mock<IRepository<TempUser>> _mockUserRepo;
    private readonly Mock<IRepository<MatchRequest>> _mockMatchRepo;
    private readonly Mock<IRepository<ChatMessage>> _mockChatRepo;
    private readonly Mock<IRepository<UserReport>> _mockReportRepo;
    private readonly TempUserService _service;

    public TempUserServiceTests()
    {
        _mockUserRepo = new Mock<IRepository<TempUser>>();
        _mockMatchRepo = new Mock<IRepository<MatchRequest>>();
        _mockChatRepo = new Mock<IRepository<ChatMessage>>();
        _mockReportRepo = new Mock<IRepository<UserReport>>();

        _mockMatchRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<MatchRequest, bool>>>()))
            .ReturnsAsync(new List<MatchRequest>());
        _mockChatRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<ChatMessage, bool>>>()))
            .ReturnsAsync(new List<ChatMessage>());
        _mockReportRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<UserReport, bool>>>()))
            .ReturnsAsync(new List<UserReport>());

        _service = new TempUserService(
            _mockUserRepo.Object, 
            _mockMatchRepo.Object, 
            _mockChatRepo.Object, 
            _mockReportRepo.Object);
    }

    [Fact]
    public async Task CreateUser_SetsExpiry3Hours()
    {
        // Arrange
        var dto = new CreateTempUserDto { DisplayName = "Alice" };

        // Act
        var result = await _service.CreateTempUserAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Alice", result.DisplayName);
        Assert.True(result.ExpiresAt > DateTime.UtcNow.AddHours(2) && result.ExpiresAt <= DateTime.UtcNow.AddHours(3.1));
        _mockUserRepo.Verify(r => r.AddAsync(It.Is<TempUser>(u => u.DisplayName == "Alice")), Times.Once);
    }

    [Fact]
    public async Task CleanupExpired_RemovesOldUsers()
    {
        // Arrange
        var expiredUsers = new List<TempUser>
        {
            new TempUser { Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(-1) },
            new TempUser { Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(-2) }
        };
        _mockUserRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<TempUser, bool>>>()))
            .ReturnsAsync(expiredUsers);

        // Act
        await _service.CleanupExpiredUsersAsync();

        // Assert
        _mockUserRepo.Verify(r => r.DeleteAsync(It.IsAny<TempUser>()), Times.Exactly(2));
    }
}
