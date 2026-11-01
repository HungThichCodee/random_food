using System.Security.Claims;
using FoodMatch.Api.Controllers;
using FoodMatch.Api.Hubs;
using FoodMatch.Api.Services;
using FoodMatch.Application.DTOs.Match;
using FoodMatch.Application.DTOs.TempUser;
using FoodMatch.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Moq;
using Xunit;

namespace FoodMatch.Tests.Services;

public class MeetingSuggestionsControllerTests
{
    [Fact]
    public async Task DoesNotCallPlaceProviderBeforeBothParticipantsShare()
    {
        var userId = Guid.NewGuid();
        var matchService = new Mock<IMatchService>();
        matchService.Setup(service => service.GetMatchForUserAsync(7, userId))
            .ReturnsAsync(new MatchRequestDto
            {
                Id = 7, Status = "Accepted", HasSharedLocation = true,
                BuddyHasSharedLocation = false
            });
        var tempUsers = new Mock<ITempUserService>();
        var provider = new Mock<IMeetingPlaceService>();
        var controller = CreateController(userId, matchService, tempUsers, provider);

        var response = await controller.GetMeetingSuggestions(7);

        Assert.IsType<ForbidResult>(response.Result);
        provider.Verify(service => service.SuggestAsync(
            It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>(),
            It.IsAny<double>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ReturnsGoogleSearchFallbackWhenPlaceProviderFails()
    {
        var userId = Guid.NewGuid();
        var matchService = new Mock<IMatchService>();
        matchService.Setup(service => service.GetMatchForUserAsync(7, userId))
            .ReturnsAsync(new MatchRequestDto
            {
                Id = 7, Status = "Accepted", HasSharedLocation = true,
                BuddyHasSharedLocation = true, BuddyLat = 10.3, BuddyLng = 106.3
            });
        var tempUsers = new Mock<ITempUserService>();
        tempUsers.Setup(service => service.GetByIdAsync(userId))
            .ReturnsAsync(new TempUserDto { Id = userId, CurrentLat = 10.1, CurrentLng = 106.1 });
        var provider = new Mock<IMeetingPlaceService>();
        provider.Setup(service => service.SuggestAsync(
                10.1, 106.1, 10.3, 106.3, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("Provider unavailable"));
        var controller = CreateController(userId, matchService, tempUsers, provider);

        var response = await controller.GetMeetingSuggestions(7);

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var body = Assert.IsType<MeetingSuggestionsDto>(ok.Value);
        Assert.False(body.ProviderAvailable);
        Assert.Empty(body.Places);
        Assert.StartsWith("https://www.google.com/maps/search/?api=1&query=", body.SearchUrl);
        Assert.StartsWith("https://maps.google.com/maps?q=", body.EmbedUrl);
    }

    [Theory]
    [InlineData("cafe", "quán cà phê")]
    [InlineData("vegetarian", "quán chay")]
    [InlineData("dessert", "quán chè bánh ngọt")]
    public async Task SearchKindChangesGoogleQueryWithoutChangingExactMidpoint(
        string kind, string expectedQuery)
    {
        var userId = Guid.NewGuid();
        var matchService = new Mock<IMatchService>();
        matchService.Setup(service => service.GetMatchForUserAsync(7, userId))
            .ReturnsAsync(new MatchRequestDto
            {
                Id = 7, Status = "Accepted", HasSharedLocation = true,
                BuddyHasSharedLocation = true, BuddyLat = 10.7768765432,
                BuddyLng = 106.7008765432
            });
        var tempUsers = new Mock<ITempUserService>();
        tempUsers.Setup(service => service.GetByIdAsync(userId))
            .ReturnsAsync(new TempUserDto
            {
                Id = userId, CurrentLat = 10.7761234567,
                CurrentLng = 106.7001234567
            });
        var provider = new Mock<IMeetingPlaceService>();
        var controller = CreateController(userId, matchService, tempUsers, provider);

        var response = await controller.GetMeetingSuggestions(7, kind);

        var body = Assert.IsType<MeetingSuggestionsDto>(Assert.IsType<OkObjectResult>(response.Result).Value);
        Assert.Contains("q=" + Uri.EscapeDataString(expectedQuery), body.EmbedUrl);
        var query = Uri.UnescapeDataString(body.EmbedUrl.Split("q=")[1].Split('&')[0]);
        var center = query.Split(" gần ")[1]
            .Split(',').Select(value => double.Parse(value,
                System.Globalization.CultureInfo.InvariantCulture)).ToArray();
        Assert.Equal((10.7761234567 + 10.7768765432) / 2, center[0]);
        Assert.Equal((106.7001234567 + 106.7008765432) / 2, center[1]);
        Assert.Empty(body.Places);
        Assert.False(body.ProviderAvailable);
        provider.Verify(service => service.SuggestAsync(
            It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RejectsUnsupportedMeetingSearchKindBeforeReadingMatch()
    {
        var userId = Guid.NewGuid();
        var matchService = new Mock<IMatchService>();
        var tempUsers = new Mock<ITempUserService>();
        var provider = new Mock<IMeetingPlaceService>();
        var controller = CreateController(userId, matchService, tempUsers, provider);

        var response = await controller.GetMeetingSuggestions(7, "anything-else");

        Assert.IsType<BadRequestObjectResult>(response.Result);
        matchService.Verify(service => service.GetMatchForUserAsync(
            It.IsAny<int>(), It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task ConsentRevokedWhileProviderRunsDoesNotReturnPlaces()
    {
        var userId = Guid.NewGuid();
        var active = new MatchRequestDto
        {
            Id = 7, Status = "Accepted", HasSharedLocation = true,
            BuddyHasSharedLocation = true, BuddyLat = 10.3, BuddyLng = 106.3
        };
        var revoked = new MatchRequestDto { Id = 7, Status = "Accepted" };
        var matchService = new Mock<IMatchService>();
        matchService.SetupSequence(service => service.GetMatchForUserAsync(7, userId))
            .ReturnsAsync(active).ReturnsAsync(revoked);
        var tempUsers = new Mock<ITempUserService>();
        tempUsers.Setup(service => service.GetByIdAsync(userId))
            .ReturnsAsync(new TempUserDto { Id = userId, CurrentLat = 10.1, CurrentLng = 106.1 });
        var provider = new Mock<IMeetingPlaceService>();
        provider.Setup(service => service.SuggestAsync(10.1, 106.1, 10.3, 106.3,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { new MeetingPlaceDto("node/1", "Quán", "restaurant", 10.2, 106.2, 0) });
        var controller = CreateController(userId, matchService, tempUsers, provider);

        var response = await controller.GetMeetingSuggestions(7);

        Assert.IsType<ForbidResult>(response.Result);
    }

    [Fact]
    public async Task GpsChangedWhileProviderRunsUsesFreshGoogleMidpoint()
    {
        var userId = Guid.NewGuid();
        var oldMatch = new MatchRequestDto
        {
            Id = 7, Status = "Accepted", HasSharedLocation = true,
            BuddyHasSharedLocation = true, BuddyLat = 12, BuddyLng = 108
        };
        var latestMatch = new MatchRequestDto
        {
            Id = 7, Status = "Accepted", HasSharedLocation = true,
            BuddyHasSharedLocation = true, BuddyLat = 13, BuddyLng = 109
        };
        var matchService = new Mock<IMatchService>();
        matchService.SetupSequence(service => service.GetMatchForUserAsync(7, userId))
            .ReturnsAsync(oldMatch).ReturnsAsync(latestMatch);
        var tempUsers = new Mock<ITempUserService>();
        tempUsers.SetupSequence(service => service.GetByIdAsync(userId))
            .ReturnsAsync(new TempUserDto { Id = userId, CurrentLat = 10, CurrentLng = 106 })
            .ReturnsAsync(new TempUserDto { Id = userId, CurrentLat = 11, CurrentLng = 107 });
        var provider = new Mock<IMeetingPlaceService>();
        provider.Setup(service => service.SuggestAsync(10, 106, 12, 108,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { new MeetingPlaceDto("node/1", "Quán cũ", "restaurant", 11, 107, 0) });
        var controller = CreateController(userId, matchService, tempUsers, provider);

        var response = await controller.GetMeetingSuggestions(7);

        var body = Assert.IsType<MeetingSuggestionsDto>(Assert.IsType<OkObjectResult>(response.Result).Value);
        Assert.Contains("%20g%E1%BA%A7n%2012%2C108", body.EmbedUrl);
        Assert.Contains("12%2C108", body.SearchUrl);
        Assert.Empty(body.Places);
        Assert.False(body.ProviderAvailable);
    }

    [Fact]
    public async Task CannotProposePlaceThatProviderDidNotSuggest()
    {
        var userId = Guid.NewGuid();
        var matchService = new Mock<IMatchService>();
        matchService.Setup(service => service.GetMatchForUserAsync(7, userId))
            .ReturnsAsync(new MatchRequestDto
            {
                Id = 7, Status = "Accepted", HasSharedLocation = true,
                BuddyHasSharedLocation = true, BuddyLat = 10.3, BuddyLng = 106.3
            });
        var tempUsers = new Mock<ITempUserService>();
        tempUsers.Setup(service => service.GetByIdAsync(userId))
            .ReturnsAsync(new TempUserDto { Id = userId, CurrentLat = 10.1, CurrentLng = 106.1 });
        var provider = new Mock<IMeetingPlaceService>();
        provider.Setup(service => service.SuggestAsync(10.1, 106.1, 10.3, 106.3,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { new MeetingPlaceDto("node/1", "Quán", "restaurant", 10.2, 106.2, 0) });
        var controller = CreateController(userId, matchService, tempUsers, provider);

        var response = await controller.ProposeMeetingPlace(7, new SelectMeetingPlaceDto("node/999"));

        Assert.IsType<BadRequestObjectResult>(response.Result);
        matchService.Verify(service => service.ProposeMeetingPlaceAsync(
            It.IsAny<int>(), It.IsAny<Guid>(), It.IsAny<MeetingPlaceSelection>()), Times.Never);
    }

    private static MatchRequestsController CreateController(Guid userId,
        Mock<IMatchService> matchService, Mock<ITempUserService> tempUsers,
        Mock<IMeetingPlaceService> provider)
    {
        var controller = new MatchRequestsController(matchService.Object,
            new Mock<IHubContext<MatchHub>>().Object, tempUsers.Object, provider.Object);
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test"))
        };
        controller.ControllerContext = new ControllerContext { HttpContext = context };
        return controller;
    }
}
