using System.Security.Claims;
using FoodMatch.Api.Controllers;
using FoodMatch.Api.Hubs;
using FoodMatch.Api.Services;
using FoodMatch.Application.DTOs.Match;
using FoodMatch.Application.DTOs.Chat;
using FoodMatch.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace FoodMatch.Tests.Services;

public class NotificationReliabilityControllerTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SharingChangeForDeletedMatchReturns404(bool stopSharing)
    {
        var userId = Guid.NewGuid();
        var matchService = new Mock<IMatchService>();
        matchService.Setup(service => service.ShareLocationAsync(7, userId))
            .ThrowsAsync(new KeyNotFoundException());
        matchService.Setup(service => service.StopSharingLocationAsync(7, userId))
            .ThrowsAsync(new KeyNotFoundException());
        var controller = new MatchRequestsController(matchService.Object,
            new Mock<IHubContext<MatchHub>>().Object,
            new Mock<ITempUserService>().Object,
            new Mock<IMeetingPlaceService>().Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.NameIdentifier, userId.ToString())], "test"))
                }
            }
        };

        var response = stopSharing
            ? await controller.StopSharingLocation(7)
            : await controller.ShareLocation(7);

        Assert.IsType<NotFoundResult>(response.Result);
    }

    [Fact]
    public async Task ShareLocationNotifiesBuddyWithBuddysOwnViewOfMatch()
    {
        var userId = Guid.NewGuid();
        var buddyId = Guid.NewGuid();
        var ownResult = new MatchRequestDto
        {
            Id = 7, FromUserId = userId, ToUserId = buddyId,
            Status = "Accepted", HasSharedLocation = true,
            BuddyHasSharedLocation = false
        };
        var buddyResult = new MatchRequestDto
        {
            Id = 7, FromUserId = userId, ToUserId = buddyId,
            Status = "Accepted", HasSharedLocation = false,
            BuddyHasSharedLocation = true
        };
        var matchService = new Mock<IMatchService>();
        matchService.Setup(service => service.ShareLocationAsync(7, userId))
            .ReturnsAsync(ownResult);
        matchService.Setup(service => service.GetMatchForUserAsync(7, buddyId))
            .ReturnsAsync(buddyResult);
        object?[]? sentArguments = null;
        var proxy = new Mock<IClientProxy>();
        proxy.Setup(client => client.SendCoreAsync("LocationSharingUpdated",
                It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
            .Callback<string, object?[], CancellationToken>((_, args, _) => sentArguments = args)
            .Returns(Task.CompletedTask);
        var clients = new Mock<IHubClients>();
        clients.Setup(value => value.User(buddyId.ToString())).Returns(proxy.Object);
        var hub = new Mock<IHubContext<MatchHub>>();
        hub.SetupGet(value => value.Clients).Returns(clients.Object);
        var controller = new MatchRequestsController(matchService.Object, hub.Object,
            new Mock<ITempUserService>().Object, new Mock<IMeetingPlaceService>().Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.NameIdentifier, userId.ToString())], "test")),
                    RequestServices = new ServiceCollection().AddLogging().BuildServiceProvider()
                }
            }
        };

        var response = await controller.ShareLocation(7);

        Assert.Same(ownResult, Assert.IsType<OkObjectResult>(response.Result).Value);
        Assert.Same(buddyResult, Assert.Single(Assert.IsType<object?[]>(sentArguments)));
        Assert.Null(buddyResult.BuddyLat);
        matchService.Verify(service => service.GetMatchForUserAsync(7, buddyId), Times.Once);
    }

    [Fact]
    public async Task SendMessageReturnsSavedMessageWhenSignalRNotificationFails()
    {
        var userId = Guid.NewGuid();
        var dto = new SendMessageDto { MatchRequestId = 7, Message = "Xin chào" };
        var saved = new ChatMessageDto
        {
            Id = 12, SenderUserId = userId, Message = dto.Message,
            SentAt = DateTime.UtcNow
        };
        var chatService = new Mock<IChatService>();
        chatService.Setup(service => service.SendMessageAsync(userId, dto))
            .ReturnsAsync(saved);
        var proxy = new Mock<IClientProxy>();
        proxy.Setup(client => client.SendCoreAsync("ReceiveMessage",
                It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Hub unavailable"));
        var clients = new Mock<IHubClients>();
        clients.Setup(value => value.Group("7")).Returns(proxy.Object);
        var hub = new Mock<IHubContext<ChatHub>>();
        hub.SetupGet(value => value.Clients).Returns(clients.Object);
        var controller = new ChatController(chatService.Object, hub.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.NameIdentifier, userId.ToString())], "test")),
                    RequestServices = new ServiceCollection().AddLogging().BuildServiceProvider()
                }
            }
        };

        var response = await controller.SendMessage(dto);

        Assert.Same(saved, Assert.IsType<OkObjectResult>(response).Value);
        proxy.Verify(client => client.SendCoreAsync("ReceiveMessage",
            It.IsAny<object?[]>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task StopSharingReturnsCommittedResultWhenSignalRNotificationFails()
    {
        var userId = Guid.NewGuid();
        var buddyId = Guid.NewGuid();
        var ownResult = new MatchRequestDto
        {
            Id = 7, FromUserId = userId, ToUserId = buddyId,
            Status = "Accepted", HasSharedLocation = false,
            BuddyHasSharedLocation = true
        };
        var buddyResult = new MatchRequestDto
        {
            Id = 7, FromUserId = userId, ToUserId = buddyId,
            Status = "Accepted", HasSharedLocation = true,
            BuddyHasSharedLocation = false
        };
        var matchService = new Mock<IMatchService>();
        matchService.Setup(service => service.StopSharingLocationAsync(7, userId))
            .ReturnsAsync(ownResult);
        matchService.Setup(service => service.GetMatchForUserAsync(7, buddyId))
            .ReturnsAsync(buddyResult);

        var proxy = new Mock<IClientProxy>();
        proxy.Setup(client => client.SendCoreAsync("LocationSharingUpdated",
                It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Hub unavailable"));
        var clients = new Mock<IHubClients>();
        clients.Setup(value => value.User(buddyId.ToString())).Returns(proxy.Object);
        var hub = new Mock<IHubContext<MatchHub>>();
        hub.SetupGet(value => value.Clients).Returns(clients.Object);

        var controller = new MatchRequestsController(matchService.Object, hub.Object,
            new Mock<ITempUserService>().Object, new Mock<IMeetingPlaceService>().Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(ClaimTypes.NameIdentifier, userId.ToString())], "test")),
                RequestServices = new ServiceCollection().AddLogging().BuildServiceProvider()
            }
        };

        var response = await controller.StopSharingLocation(7);

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        Assert.Same(ownResult, ok.Value);
        Assert.Null(ownResult.BuddyLat);
        Assert.Null(buddyResult.BuddyLat);
        proxy.Verify(client => client.SendCoreAsync("LocationSharingUpdated",
            It.IsAny<object?[]>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
