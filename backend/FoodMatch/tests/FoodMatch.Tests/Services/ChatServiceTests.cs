using FoodMatch.Application.DTOs.Chat;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.Services;
using FoodMatch.Domain.Entities;
using FoodMatch.Domain.Enums;
using Moq;
using System.Linq.Expressions;
using Xunit;

namespace FoodMatch.Tests.Services;

public class ChatServiceTests
{
    [Fact]
    public async Task UnrelatedUserCannotReadOrSendMessages()
    {
        var match = new MatchRequest
        {
            Id = 42,
            FromTempUserId = Guid.NewGuid(),
            ToTempUserId = Guid.NewGuid(),
            Status = MatchStatus.Accepted
        };
        var stranger = Guid.NewGuid();
        var messages = new Mock<IRepository<ChatMessage>>();
        var matches = new Mock<IRepository<MatchRequest>>();
        matches.Setup(x => x.GetByIdAsync(match.Id)).ReturnsAsync(match);
        var service = new ChatService(messages.Object, matches.Object, ActiveUsers().Object);

        Assert.False(await service.CanAccessMatchAsync(match.Id, stranger));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.GetMessagesAsync(match.Id, stranger));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.SendMessageAsync(stranger,
            new SendMessageDto { MatchRequestId = match.Id, Message = "hello" }));
        messages.Verify(x => x.AddAsync(It.IsAny<ChatMessage>()), Times.Never);
    }

    [Fact]
    public async Task PendingMatchCannotOpenChat()
    {
        var userId = Guid.NewGuid();
        var matches = new Mock<IRepository<MatchRequest>>();
        matches.Setup(x => x.GetByIdAsync(12)).ReturnsAsync(new MatchRequest
        {
            Id = 12,
            FromTempUserId = userId,
            ToTempUserId = Guid.NewGuid(),
            Status = MatchStatus.Pending
        });
        var service = new ChatService(new Mock<IRepository<ChatMessage>>().Object,
            matches.Object, ActiveUsers().Object);

        Assert.False(await service.CanAccessMatchAsync(12, userId));
    }

    [Fact]
    public async Task ReconnectedUserJoinsOnlyAcceptedOwnMatches()
    {
        var userId = Guid.NewGuid();
        var matches = new[]
        {
            new MatchRequest { Id = 1, FromTempUserId = userId, ToTempUserId = Guid.NewGuid(), Status = MatchStatus.Accepted },
            new MatchRequest { Id = 2, FromTempUserId = Guid.NewGuid(), ToTempUserId = userId, Status = MatchStatus.Accepted },
            new MatchRequest { Id = 3, FromTempUserId = userId, ToTempUserId = Guid.NewGuid(), Status = MatchStatus.Pending },
            new MatchRequest { Id = 4, FromTempUserId = Guid.NewGuid(), ToTempUserId = Guid.NewGuid(), Status = MatchStatus.Accepted }
        };
        var matchRepo = new Mock<IRepository<MatchRequest>>();
        matchRepo.Setup(repo => repo.FindAsync(It.IsAny<Expression<Func<MatchRequest, bool>>>() ))
            .ReturnsAsync((Expression<Func<MatchRequest, bool>> predicate) =>
                matches.Where(predicate.Compile()).ToList());
        var service = new ChatService(new Mock<IRepository<ChatMessage>>().Object,
            matchRepo.Object, ActiveUsers().Object);

        Assert.Equal(new[] { 1, 2 }, await service.GetActiveMatchIdsAsync(userId));
    }

    [Fact]
    public async Task ExpiredParticipantCannotReadSendOrRejoinChat()
    {
        var current = Guid.NewGuid();
        var expired = Guid.NewGuid();
        var match = new MatchRequest
        {
            Id = 51, FromTempUserId = current, ToTempUserId = expired,
            Status = MatchStatus.Accepted
        };
        var matches = new Mock<IRepository<MatchRequest>>();
        matches.Setup(x => x.GetByIdAsync(match.Id)).ReturnsAsync(match);
        matches.Setup(x => x.FindAsync(It.IsAny<Expression<Func<MatchRequest, bool>>>() ))
            .ReturnsAsync(new[] { match });
        var users = new Mock<IRepository<TempUser>>();
        users.Setup(x => x.GetByIdAsync(current)).ReturnsAsync(new TempUser
        {
            Id = current, ExpiresAt = DateTime.UtcNow.AddHours(1)
        });
        users.Setup(x => x.GetByIdAsync(expired)).ReturnsAsync(new TempUser
        {
            Id = expired, ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
        });
        var messages = new Mock<IRepository<ChatMessage>>();
        var service = new ChatService(messages.Object, matches.Object, users.Object);

        Assert.False(await service.CanAccessMatchAsync(match.Id, current));
        Assert.Empty(await service.GetActiveMatchIdsAsync(current));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetMessagesAsync(match.Id, current));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.SendMessageAsync(current,
                new SendMessageDto { MatchRequestId = match.Id, Message = "hello" }));
        messages.Verify(x => x.AddAsync(It.IsAny<ChatMessage>()), Times.Never);
    }

    private static Mock<IRepository<TempUser>> ActiveUsers()
    {
        var users = new Mock<IRepository<TempUser>>();
        users.Setup(x => x.GetByIdAsync(It.IsAny<object>()))
            .ReturnsAsync((object id) => new TempUser
            {
                Id = (Guid)id, ExpiresAt = DateTime.UtcNow.AddHours(1)
            });
        return users;
    }
}
