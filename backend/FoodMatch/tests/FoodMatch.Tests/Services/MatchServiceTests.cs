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
        _mockUserRepo.Setup(r => r.GetByIdAsync(fromUser)).ReturnsAsync(new TempUser
        {
            Id = fromUser, DisplayName = "Alice", ExpiresAt = DateTime.UtcNow.AddHours(3),
            CurrentLat = 10.776, CurrentLng = 106.700
        });
        _mockUserRepo.Setup(r => r.GetByIdAsync(toUser)).ReturnsAsync(new TempUser
        {
            Id = toUser, DisplayName = "Bob", ExpiresAt = DateTime.UtcNow.AddHours(3),
            LocationVisible = true, CurrentLat = 10.777, CurrentLng = 106.701
        });
        
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

    [Theory]
    [InlineData(null, null, 10.777, 106.701)]
    [InlineData(10.776, 106.700, 10.850, 106.701)]
    [InlineData(10.776, 106.700, null, null)]
    public async Task SendRequest_RejectsTargetOutsideNearbyDiscovery(
        double? fromLat, double? fromLng, double? toLat, double? toLng)
    {
        var fromId = Guid.NewGuid();
        var toId = Guid.NewGuid();
        _mockUserRepo.Setup(r => r.GetByIdAsync(fromId)).ReturnsAsync(new TempUser
        {
            Id = fromId, ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = fromLat, CurrentLng = fromLng
        });
        _mockUserRepo.Setup(r => r.GetByIdAsync(toId)).ReturnsAsync(new TempUser
        {
            Id = toId, ExpiresAt = DateTime.UtcNow.AddHours(1),
            LocationVisible = true, CurrentLat = toLat, CurrentLng = toLng
        });

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.SendMatchRequestAsync(fromId, new CreateMatchRequestDto { ToTempUserId = toId }));
        _mockMatchRepo.Verify(r => r.AddAsync(It.IsAny<MatchRequest>()), Times.Never);
    }

    [Fact]
    public async Task RespondAccept_UpdatesStatus()
    {
        // Arrange
        var requestId = 1;
        var req = new MatchRequest { Id = requestId, FromTempUserId = Guid.NewGuid(), ToTempUserId = Guid.NewGuid(), Status = MatchStatus.Pending };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(requestId)).ReturnsAsync(req);
        _mockUserRepo.Setup(r => r.GetByIdAsync(req.FromTempUserId)).ReturnsAsync(
            new TempUser { Id = req.FromTempUserId, ExpiresAt = DateTime.UtcNow.AddHours(1) });
        _mockUserRepo.Setup(r => r.GetByIdAsync(req.ToTempUserId)).ReturnsAsync(
            new TempUser { Id = req.ToTempUserId, ExpiresAt = DateTime.UtcNow.AddHours(1) });

        // Act
        var result = await _service.RespondToRequestAsync(requestId, req.ToTempUserId, true);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Accepted", result.Status);
        _mockMatchRepo.Verify(r => r.UpdateAsync(It.Is<MatchRequest>(m => m.Status == MatchStatus.Accepted)), Times.Once);
    }

    [Fact]
    public async Task RespondRejectsOtherUser()
    {
        var requestId = 9;
        var req = new MatchRequest { Id = requestId, FromTempUserId = Guid.NewGuid(), ToTempUserId = Guid.NewGuid(), Status = MatchStatus.Pending };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(requestId)).ReturnsAsync(req);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.RespondToRequestAsync(requestId, Guid.NewGuid(), true));
        _mockMatchRepo.Verify(r => r.UpdateAsync(It.IsAny<MatchRequest>()), Times.Never);
    }

    [Fact]
    public async Task ExpiredSenderCannotBeAcceptedBeforeCleanupRuns()
    {
        var request = new MatchRequest
        {
            Id = 11, FromTempUserId = Guid.NewGuid(), ToTempUserId = Guid.NewGuid(),
            Status = MatchStatus.Pending
        };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(request.Id)).ReturnsAsync(request);
        _mockUserRepo.Setup(r => r.GetByIdAsync(request.FromTempUserId)).ReturnsAsync(
            new TempUser { Id = request.FromTempUserId,
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1) });
        _mockUserRepo.Setup(r => r.GetByIdAsync(request.ToTempUserId)).ReturnsAsync(
            new TempUser { Id = request.ToTempUserId,
                ExpiresAt = DateTime.UtcNow.AddHours(1) });

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.RespondToRequestAsync(request.Id, request.ToTempUserId, true));
        Assert.Equal(MatchStatus.Pending, request.Status);
        _mockMatchRepo.Verify(r => r.UpdateAsync(It.IsAny<MatchRequest>()), Times.Never);
    }

    [Fact]
    public async Task GetPending_ReturnsOnlyPending()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var senderId = Guid.NewGuid();
        var pendingRequests = new List<MatchRequest>
        {
            new MatchRequest { Id = 1, FromTempUserId = senderId,
                ToTempUserId = userId, Status = MatchStatus.Pending }
        };
        _mockMatchRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<MatchRequest, bool>>>()))
            .ReturnsAsync(pendingRequests);
        _mockUserRepo.Setup(r => r.GetByIdAsync(senderId)).ReturnsAsync(
            new TempUser { Id = senderId, ExpiresAt = DateTime.UtcNow.AddHours(1) });
        _mockUserRepo.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(
            new TempUser { Id = userId, ExpiresAt = DateTime.UtcNow.AddHours(1) });

        // Act
        var result = await _service.GetPendingRequestsAsync(userId);

        // Assert
        Assert.Single(result);
        Assert.Equal("Pending", result[0].Status);
    }

    [Fact]
    public async Task ExpiredSenderInvitationIsHiddenBeforeCleanup()
    {
        var receiverId = Guid.NewGuid();
        var senderId = Guid.NewGuid();
        _mockMatchRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<MatchRequest, bool>>>()))
            .ReturnsAsync(new List<MatchRequest>
            {
                new() { Id = 12, FromTempUserId = senderId,
                    ToTempUserId = receiverId, Status = MatchStatus.Pending }
            });
        _mockUserRepo.Setup(r => r.GetByIdAsync(senderId)).ReturnsAsync(
            new TempUser { Id = senderId, ExpiresAt = DateTime.UtcNow.AddMinutes(-1) });
        _mockUserRepo.Setup(r => r.GetByIdAsync(receiverId)).ReturnsAsync(
            new TempUser { Id = receiverId, ExpiresAt = DateTime.UtcNow.AddHours(1) });

        Assert.Empty(await _service.GetPendingRequestsAsync(receiverId));
    }

    [Fact]
    public async Task ExpiredPartnerMatchIsHiddenFromDetailAndActiveListBeforeCleanup()
    {
        var callerId = Guid.NewGuid();
        var expiredId = Guid.NewGuid();
        var activeId = Guid.NewGuid();
        var stale = new MatchRequest
        {
            Id = 13, FromTempUserId = callerId, ToTempUserId = expiredId,
            Status = MatchStatus.Accepted
        };
        var current = new MatchRequest
        {
            Id = 14, FromTempUserId = callerId, ToTempUserId = activeId,
            Status = MatchStatus.Accepted
        };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(stale.Id)).ReturnsAsync(stale);
        _mockMatchRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<MatchRequest, bool>>>()))
            .ReturnsAsync(new List<MatchRequest> { stale, current });
        _mockUserRepo.Setup(r => r.GetByIdAsync(callerId)).ReturnsAsync(
            new TempUser { Id = callerId, ExpiresAt = DateTime.UtcNow.AddHours(1) });
        _mockUserRepo.Setup(r => r.GetByIdAsync(expiredId)).ReturnsAsync(
            new TempUser { Id = expiredId, DisplayName = "Expired partner",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1) });
        _mockUserRepo.Setup(r => r.GetByIdAsync(activeId)).ReturnsAsync(
            new TempUser { Id = activeId, ExpiresAt = DateTime.UtcNow.AddHours(1) });

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.GetMatchForUserAsync(stale.Id, callerId));
        Assert.Equal(current.Id, (await _service.GetActiveMatchAsync(callerId))?.Id);
    }

    [Fact]
    public async Task EachParticipantControlsVisibilityOfTheirOwnExactLocation()
    {
        var from = new TempUser
        {
            Id = Guid.NewGuid(), DisplayName = "A", ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 10.1234567890123, CurrentLng = 106.987654321098
        };
        var to = new TempUser
        {
            Id = Guid.NewGuid(), DisplayName = "B", ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 11.2345678901234, CurrentLng = 107.876543210987
        };
        var match = new MatchRequest
        {
            Id = 42, FromTempUserId = from.Id, ToTempUserId = to.Id,
            Status = MatchStatus.Accepted, FromUserSharedLocation = true,
            FromUserSharedAt = DateTime.UtcNow
        };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(match.Id)).ReturnsAsync(match);
        _mockUserRepo.Setup(r => r.GetByIdAsync(from.Id)).ReturnsAsync(from);
        _mockUserRepo.Setup(r => r.GetByIdAsync(to.Id)).ReturnsAsync(to);

        var before = await _service.GetMatchForUserAsync(match.Id, to.Id);
        Assert.Equal(from.CurrentLat, before.BuddyLat);
        Assert.Equal(from.CurrentLng, before.BuddyLng);
        Assert.False(before.HasSharedLocation);
        Assert.True(before.BuddyHasSharedLocation);
        var beforeForA = await _service.GetMatchForUserAsync(match.Id, from.Id);
        Assert.Null(beforeForA.BuddyLat);
        Assert.Null(beforeForA.BuddyLng);

        match.ToUserSharedLocation = true;
        match.ToUserSharedAt = DateTime.UtcNow;
        match.LocationSharedAt = DateTime.UtcNow;
        var forB = await _service.GetMatchForUserAsync(match.Id, to.Id);
        var forA = await _service.GetMatchForUserAsync(match.Id, from.Id);

        Assert.Equal(from.CurrentLat, forB.BuddyLat);
        Assert.Equal(from.CurrentLng, forB.BuddyLng);
        Assert.Equal(to.CurrentLat, forA.BuddyLat);
        Assert.Equal(to.CurrentLng, forA.BuddyLng);
        await _service.StopSharingLocationAsync(match.Id, from.Id);
        var afterForA = await _service.GetMatchForUserAsync(match.Id, from.Id);
        var afterForB = await _service.GetMatchForUserAsync(match.Id, to.Id);
        Assert.Equal(to.CurrentLat, afterForA.BuddyLat);
        Assert.Null(afterForB.BuddyLat);
        Assert.True(afterForB.HasSharedLocation);
        Assert.False(afterForB.BuddyHasSharedLocation);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.GetMatchForUserAsync(match.Id, Guid.NewGuid()));
    }

    [Fact]
    public async Task ExpiredShareCannotBeExtendedByOneParticipant()
    {
        var from = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 10.123456789, CurrentLng = 106.987654321
        };
        var to = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 11.23456789, CurrentLng = 107.87654321
        };
        var match = new MatchRequest
        {
            Id = 43, FromTempUserId = from.Id, ToTempUserId = to.Id,
            Status = MatchStatus.Accepted,
            FromUserSharedLocation = true, ToUserSharedLocation = true,
            FromUserSharedAt = DateTime.UtcNow.AddMinutes(-61),
            ToUserSharedAt = DateTime.UtcNow.AddMinutes(-61),
            LocationSharedAt = DateTime.UtcNow.AddMinutes(-61)
        };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(match.Id)).ReturnsAsync(match);
        _mockUserRepo.Setup(r => r.GetByIdAsync(from.Id)).ReturnsAsync(from);
        _mockUserRepo.Setup(r => r.GetByIdAsync(to.Id)).ReturnsAsync(to);

        var response = await _service.ShareLocationAsync(match.Id, from.Id);

        Assert.True(response.HasSharedLocation);
        Assert.False(response.BuddyHasSharedLocation);
        Assert.Null(response.BuddyLat);
        Assert.Null(response.BuddyLng);
        Assert.Null(match.LocationSharedAt);
        var forB = await _service.GetMatchForUserAsync(match.Id, to.Id);
        Assert.Equal(from.CurrentLat, forB.BuddyLat);
        Assert.False(forB.HasSharedLocation);
    }

    [Fact]
    public async Task ExpiryOfOneShareDoesNotHideTheOtherActiveShare()
    {
        var from = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 10.123456789, CurrentLng = 106.987654321
        };
        var to = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 11.234567891, CurrentLng = 107.876543219
        };
        var match = new MatchRequest
        {
            Id = 430, FromTempUserId = from.Id, ToTempUserId = to.Id,
            Status = MatchStatus.Accepted,
            FromUserSharedLocation = true, FromUserSharedAt = DateTime.UtcNow.AddMinutes(-61),
            ToUserSharedLocation = true, ToUserSharedAt = DateTime.UtcNow.AddMinutes(-10),
            LocationSharedAt = DateTime.UtcNow.AddMinutes(-10)
        };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(match.Id)).ReturnsAsync(match);
        _mockUserRepo.Setup(r => r.GetByIdAsync(from.Id)).ReturnsAsync(from);
        _mockUserRepo.Setup(r => r.GetByIdAsync(to.Id)).ReturnsAsync(to);

        var forA = await _service.GetMatchForUserAsync(match.Id, from.Id);
        var forB = await _service.GetMatchForUserAsync(match.Id, to.Id);

        Assert.False(forA.HasSharedLocation);
        Assert.True(forA.BuddyHasSharedLocation);
        Assert.Equal(to.CurrentLat, forA.BuddyLat);
        Assert.Equal(to.CurrentLng, forA.BuddyLng);
        Assert.True(forB.HasSharedLocation);
        Assert.False(forB.BuddyHasSharedLocation);
        Assert.Null(forB.BuddyLat);
        Assert.Null(forB.BuddyLng);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.ProposeGoogleMeetingPlaceAsync(match.Id, to.Id,
                new ProposeGoogleMeetingPlaceDto("Quán", "https://maps.google.com/maps?q=quan")));
    }

    [Fact]
    public async Task ExpiredProfileDoesNotExposePreviousLocationOrActiveConsent()
    {
        var from = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddMinutes(-1),
            CurrentLat = 10.123456789, CurrentLng = 106.987654321
        };
        var to = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 11.23456789, CurrentLng = 107.87654321
        };
        var match = new MatchRequest
        {
            Id = 44, FromTempUserId = from.Id, ToTempUserId = to.Id,
            Status = MatchStatus.Accepted,
            FromUserSharedLocation = true, ToUserSharedLocation = true,
            FromUserSharedAt = DateTime.UtcNow,
            ToUserSharedAt = DateTime.UtcNow,
            LocationSharedAt = DateTime.UtcNow
        };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(match.Id)).ReturnsAsync(match);
        _mockUserRepo.Setup(r => r.GetByIdAsync(from.Id)).ReturnsAsync(from);
        _mockUserRepo.Setup(r => r.GetByIdAsync(to.Id)).ReturnsAsync(to);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.GetMatchForUserAsync(match.Id, to.Id));
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.ShareLocationAsync(match.Id, to.Id));
    }

    [Fact]
    public async Task MeetingPlaceRequiresTwoPeopleAndConfirmationByTheOtherParticipant()
    {
        var from = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 10.123456789, CurrentLng = 106.987654321
        };
        var to = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 10.987654321, CurrentLng = 107.123456789
        };
        var match = new MatchRequest
        {
            Id = 45, FromTempUserId = from.Id, ToTempUserId = to.Id,
            Status = MatchStatus.Accepted, FromUserSharedLocation = true,
            FromUserSharedAt = DateTime.UtcNow
        };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(match.Id)).ReturnsAsync(match);
        _mockUserRepo.Setup(r => r.GetByIdAsync(from.Id)).ReturnsAsync(from);
        _mockUserRepo.Setup(r => r.GetByIdAsync(to.Id)).ReturnsAsync(to);
        var place = new MeetingPlaceSelection("node/123", "Quán gần điểm giữa", "restaurant",
            10.555555555, 107.055555555);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.ProposeMeetingPlaceAsync(match.Id, from.Id, place));
        match.ToUserSharedLocation = true;
        match.ToUserSharedAt = DateTime.UtcNow;
        match.LocationSharedAt = DateTime.UtcNow;
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.ProposeMeetingPlaceAsync(match.Id, Guid.NewGuid(), place));
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.ProposeMeetingPlaceAsync(match.Id, from.Id, place with { Lat = 12.0 }));

        var proposed = await _service.ProposeMeetingPlaceAsync(match.Id, from.Id, place);
        Assert.Equal(place.Lat, proposed.MeetingPlace?.Lat);
        Assert.Equal(place.Lng, proposed.MeetingPlace?.Lng);
        Assert.Null(proposed.MeetingPlace?.AgreedAt);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ConfirmMeetingPlaceAsync(match.Id, from.Id, place.Id));
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ConfirmMeetingPlaceAsync(match.Id, to.Id, "node/999"));

        var confirmed = await _service.ConfirmMeetingPlaceAsync(match.Id, to.Id, place.Id);
        Assert.NotNull(confirmed.MeetingPlace?.AgreedAt);
        Assert.Equal(place.Id, (await _service.GetMatchForUserAsync(match.Id, from.Id)).MeetingPlace?.Id);

        var revoked = await _service.StopSharingLocationAsync(match.Id, from.Id);
        Assert.Null(revoked.MeetingPlace);
        Assert.Null((await _service.GetMatchForUserAsync(match.Id, to.Id)).MeetingPlace);
        Assert.Null(match.MeetingPlaceId);
    }

    [Fact]
    public async Task ExpiredConsentHidesMeetingPlaceAndCannotConfirmIt()
    {
        var from = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 10, CurrentLng = 106
        };
        var to = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 11, CurrentLng = 107
        };
        var match = new MatchRequest
        {
            Id = 46, FromTempUserId = from.Id, ToTempUserId = to.Id,
            Status = MatchStatus.Accepted,
            FromUserSharedLocation = true, ToUserSharedLocation = true,
            FromUserSharedAt = DateTime.UtcNow.AddMinutes(-61),
            ToUserSharedAt = DateTime.UtcNow.AddMinutes(-61),
            LocationSharedAt = DateTime.UtcNow.AddMinutes(-61),
            MeetingPlaceId = "node/123", MeetingPlaceName = "Quán",
            MeetingPlaceCategory = "restaurant", MeetingPlaceLat = 10.5,
            MeetingPlaceLng = 106.5, MeetingPlaceProposedBy = from.Id
        };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(match.Id)).ReturnsAsync(match);
        _mockUserRepo.Setup(r => r.GetByIdAsync(from.Id)).ReturnsAsync(from);
        _mockUserRepo.Setup(r => r.GetByIdAsync(to.Id)).ReturnsAsync(to);

        Assert.Null((await _service.GetMatchForUserAsync(match.Id, to.Id)).MeetingPlace);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.ConfirmMeetingPlaceAsync(match.Id, to.Id, "node/123"));
        Assert.Null((await _service.ShareLocationAsync(match.Id, from.Id)).MeetingPlace);
        Assert.Null(match.MeetingPlaceId);
    }

    [Fact]
    public async Task GoogleMapsLinkNeedsMutualConsentAndOtherPersonConfirmation()
    {
        var from = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 10.1234567890123, CurrentLng = 106.987654321098
        };
        var to = new TempUser
        {
            Id = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddHours(1),
            CurrentLat = 10.5678901234567, CurrentLng = 107.123456789012
        };
        var match = new MatchRequest
        {
            Id = 47, FromTempUserId = from.Id, ToTempUserId = to.Id,
            Status = MatchStatus.Accepted, FromUserSharedLocation = true,
            FromUserSharedAt = DateTime.UtcNow
        };
        _mockMatchRepo.Setup(r => r.GetByIdAsync(match.Id)).ReturnsAsync(match);
        _mockUserRepo.Setup(r => r.GetByIdAsync(from.Id)).ReturnsAsync(from);
        _mockUserRepo.Setup(r => r.GetByIdAsync(to.Id)).ReturnsAsync(to);
        var place = new ProposeGoogleMeetingPlaceDto(
            "Quán ăn A", "https://maps.app.goo.gl/ExamplePlace");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.ProposeGoogleMeetingPlaceAsync(match.Id, from.Id, place));
        match.ToUserSharedLocation = true;
        match.ToUserSharedAt = DateTime.UtcNow;
        match.LocationSharedAt = DateTime.UtcNow;
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.ProposeGoogleMeetingPlaceAsync(match.Id, from.Id,
                place with { GoogleMapsUrl = "https://not-google.example/place" }));

        var proposed = await _service.ProposeGoogleMeetingPlaceAsync(match.Id, from.Id, place);
        Assert.Equal(place.GoogleMapsUrl, proposed.MeetingPlace?.GoogleMapsUrl);
        Assert.Null(proposed.MeetingPlace?.Lat);
        Assert.Equal(10.1234567890123, from.CurrentLat);
        Assert.Equal(106.987654321098, from.CurrentLng);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ConfirmMeetingPlaceAsync(match.Id, from.Id, proposed.MeetingPlace!.Id));
        var agreed = await _service.ConfirmMeetingPlaceAsync(
            match.Id, to.Id, proposed.MeetingPlace!.Id);
        Assert.NotNull(agreed.MeetingPlace?.AgreedAt);

        await _service.StopSharingLocationAsync(match.Id, from.Id);
        Assert.Null((await _service.GetMatchForUserAsync(match.Id, to.Id)).MeetingPlace);
        Assert.Null(match.MeetingPlaceGoogleMapsUrl);
    }
}
