using System.Net;
using System.Security.Claims;
using System.Threading.RateLimiting;
using FoodMatch.Api.Configuration;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace FoodMatch.Tests.Services;

public class ClientIpRateLimiterTests
{
    [Fact]
    public void IgnoresCallerSuppliedForwardingHeadersOutsideRender()
    {
        Assert.NotEqual("true", Environment.GetEnvironmentVariable("RENDER"));
        var context = Request(IPAddress.Parse("198.51.100.42"), Guid.Empty);
        context.Request.Headers["CF-Connecting-IP"] = "203.0.113.77";
        context.Request.Headers["X-Forwarded-For"] = "203.0.113.78";

        Assert.Equal("ip:198.51.100.42", ClientIpRateLimiter.GetKey(context));
    }

    [Fact]
    public void SharesIpBudgetAcrossDifferentAuthenticatedProfiles()
    {
        using var limiter = ClientIpRateLimiter.Create();
        var sharedIp = IPAddress.Parse("198.51.100.42");

        for (var i = 0; i < ClientIpRateLimiter.RequestsPerMinute; i++)
        {
            using var lease = limiter.AttemptAcquire(Request(sharedIp, Guid.NewGuid()));
            Assert.True(lease.IsAcquired);
        }

        using var rejected = limiter.AttemptAcquire(Request(sharedIp, Guid.NewGuid()));
        Assert.False(rejected.IsAcquired);
        Assert.True(rejected.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter));
        Assert.True(retryAfter > TimeSpan.Zero);
        using var otherIp = limiter.AttemptAcquire(Request(IPAddress.Parse("198.51.100.43"), Guid.NewGuid()));
        Assert.True(otherIp.IsAcquired);
    }

    [Fact]
    public void HealthCheckDoesNotSpendIpBudget()
    {
        using var limiter = ClientIpRateLimiter.Create();
        var address = IPAddress.Parse("203.0.113.20");
        for (var i = 0; i <= ClientIpRateLimiter.RequestsPerMinute; i++)
        {
            using var lease = limiter.AttemptAcquire(Request(address, Guid.Empty, "/api/health"));
            Assert.True(lease.IsAcquired);
        }

        using var firstApiRequest = limiter.AttemptAcquire(Request(address, Guid.Empty));
        Assert.True(firstApiRequest.IsAcquired);
    }

    private static DefaultHttpContext Request(IPAddress remoteIp, Guid userId,
        string path = "/api/Foods/wheel")
    {
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = remoteIp;
        context.Request.Path = path;
        context.Request.Headers["X-Forwarded-For"] = Guid.NewGuid().ToString();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId.ToString())], "test"));
        return context;
    }
}
