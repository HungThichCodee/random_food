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
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly TempUserService _service;

    public TempUserServiceTests()
    {
        _mockUserRepo = new Mock<IRepository<TempUser>>();
        _mockMatchRepo = new Mock<IRepository<MatchRequest>>();
        _mockChatRepo = new Mock<IRepository<ChatMessage>>();
        _mockReportRepo = new Mock<IRepository<UserReport>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockUnitOfWork.Setup(u => u.ExecuteInTransactionAsync(
                It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>()))
            .Returns<Func<Task>, CancellationToken>((action, _) => action());

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
            _mockReportRepo.Object,
            _mockUnitOfWork.Object);
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
    public async Task CreateUserRejectsOversizedPreferencesBeforeWriting()
    {
        var dto = new CreateTempUserDto
        {
            DisplayName = "Alice",
            FoodPreferences = Enumerable.Repeat("Chay", 11).ToList()
        };

        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateTempUserAsync(dto));
        _mockUserRepo.Verify(r => r.AddAsync(It.IsAny<TempUser>()), Times.Never);
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
        _mockUnitOfWork.Verify(u => u.ExecuteInTransactionAsync(
            It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task UpdateLocation_PreservesExactCoordinates()
    {
        var userId = Guid.NewGuid();
        var user = new TempUser { Id = userId, ExpiresAt = DateTime.UtcNow.AddHours(1) };
        _mockUserRepo.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        const double lat = 10.1234567890123;
        const double lng = 106.987654321098;

        await _service.UpdateLocationAsync(userId, lat, lng);

        Assert.Equal(lat, user.CurrentLat);
        Assert.Equal(lng, user.CurrentLng);
        Assert.True(user.LocationVisible);
        _mockUserRepo.Verify(r => r.UpdateAsync(It.Is<TempUser>(u =>
            u.Id == userId && u.CurrentLat == lat && u.CurrentLng == lng)), Times.Once);
    }

    [Fact]
    public async Task UpdateLocation_DoesNotRestoreNearbyVisibilityAfterUserHides()
    {
        var userId = Guid.NewGuid();
        var user = new TempUser
        {
            Id = userId, ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 10.1, CurrentLng = 106.1, LocationVisible = false
        };
        _mockUserRepo.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

        await _service.UpdateLocationAsync(userId, 10.123456789, 106.987654321);

        Assert.Equal(10.123456789, user.CurrentLat);
        Assert.Equal(106.987654321, user.CurrentLng);
        Assert.False(user.LocationVisible);
        _mockUserRepo.Verify(r => r.UpdateAsync(It.IsAny<TempUser>()), Times.Once);
    }

    [Fact]
    public async Task NearbyDiscoveryReturnsOnlyBroadProximityWithoutDistance()
    {
        var close = new TempUser
        {
            Id = Guid.NewGuid(), DisplayName = "Close", CurrentLat = 10.001,
            CurrentLng = 106.0, ExpiresAt = DateTime.UtcNow.AddHours(1),
            LocationVisible = true
        };
        var farther = new TempUser
        {
            Id = Guid.NewGuid(), DisplayName = "Farther", CurrentLat = 10.02,
            CurrentLng = 106.0, ExpiresAt = DateTime.UtcNow.AddHours(1),
            LocationVisible = true
        };
        var outside = new TempUser
        {
            Id = Guid.NewGuid(), DisplayName = "Outside", CurrentLat = 10.1,
            CurrentLng = 106.0, ExpiresAt = DateTime.UtcNow.AddHours(1),
            LocationVisible = true
        };
        _mockUserRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<TempUser, bool>>>()))
            .ReturnsAsync([close, farther, outside]);

        var result = await _service.GetNearbyUsersAsync(10.0, 106.0);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, user => user.Id == close.Id && user.DistanceLabel == "Trong 3 km");
        Assert.Contains(result, user => user.Id == farther.Id && user.DistanceLabel == "Trong 3 km");
        Assert.DoesNotContain(result, user => user.Id == outside.Id);
    }

    [Theory]
    [InlineData(double.NaN, 106.0)]
    [InlineData(10.0, double.PositiveInfinity)]
    [InlineData(double.NegativeInfinity, 106.0)]
    public async Task UpdateLocation_RejectsNonFiniteCoordinates(double lat, double lng)
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.UpdateLocationAsync(Guid.NewGuid(), lat, lng));
        _mockUserRepo.Verify(r => r.UpdateAsync(It.IsAny<TempUser>()), Times.Never);
    }
}
