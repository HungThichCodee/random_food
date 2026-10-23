using FoodMatch.Api.Middlewares;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FoodMatch.Tests.Services;

public class GlobalExceptionMiddlewareTests
{
    [Fact]
    public async Task ErrorResponseDoesNotEchoSensitiveExceptionMessage()
    {
        const string sensitiveValue = "secret-token-value";
        var middleware = new GlobalExceptionMiddleware(
            _ => Task.FromException(new ArgumentException(sensitiveValue)),
            new Mock<ILogger<GlobalExceptionMiddleware>>().Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        Assert.Equal(400, context.Response.StatusCode);
        Assert.DoesNotContain(sensitiveValue, body);
        Assert.Contains("Invalid request.", body);
    }
}
