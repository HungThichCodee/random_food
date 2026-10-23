using System.Net;
using FoodMatch.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace FoodMatch.Tests.Services;

public class TurnstileVerifierTests
{
    [Theory]
    [InlineData(true, "foodmatch.example", true)]
    [InlineData(false, "foodmatch.example", false)]
    [InlineData(true, "untrusted.example", false)]
    public async Task RequiresSuccessfulVerificationFromExpectedHostname(
        bool success, string hostname, bool expected)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["Turnstile:SecretKey"] = "test-secret",
                ["Turnstile:Hostname"] = "foodmatch.example"
            }).Build();
        var handler = new FakeHandler(
            $"{{\"success\":{success.ToString().ToLowerInvariant()},\"hostname\":\"{hostname}\"}}");
        var environment = new Mock<IWebHostEnvironment>();
        environment.SetupGet(e => e.EnvironmentName).Returns("Production");
        var verifier = new TurnstileVerifier(new HttpClient(handler), config, environment.Object);

        var result = await verifier.VerifyAsync("test-token", CancellationToken.None);

        Assert.Equal(expected, result);
        Assert.Equal(1, handler.RequestCount);
    }

    [Theory]
    [InlineData("foodmatch.example", true)]
    [InlineData("preview.foodmatch.vercel.app", true)]
    [InlineData("PREVIEW.FOODMATCH.VERCEL.APP", true)]
    [InlineData("other.foodmatch.vercel.app", false)]
    [InlineData("preview.foodmatch.vercel.app.attacker.example", false)]
    public async Task AllowsOnlyExplicitProductionAndPreviewHostnames(
        string hostname, bool expected)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["Turnstile:SecretKey"] = "test-secret",
                ["Turnstile:Hostname"] = "foodmatch.example, preview.foodmatch.vercel.app"
            }).Build();
        var handler = new FakeHandler(
            $"{{\"success\":true,\"hostname\":\"{hostname}\"}}");
        var environment = new Mock<IWebHostEnvironment>();
        environment.SetupGet(e => e.EnvironmentName).Returns("Production");
        var verifier = new TurnstileVerifier(new HttpClient(handler), config, environment.Object);

        Assert.Equal(expected, await verifier.VerifyAsync("test-token", CancellationToken.None));
        Assert.Equal(1, handler.RequestCount);
    }

    [Theory]
    [InlineData("https://foodmatch.example")]
    [InlineData("*.foodmatch.example")]
    [InlineData("foodmatch.example,")]
    [InlineData("foodmatch.example:443")]
    [InlineData("127.0.0.1")]
    public void RejectsInvalidHostnameConfiguration(string configured)
    {
        Assert.Throws<InvalidOperationException>(() =>
            TurnstileVerifier.ParseAllowedHostnames(configured));
    }

    [Fact]
    public async Task ProductionWithoutHostnameFailsClosedBeforeCallingProvider()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Turnstile:SecretKey"] = "test-secret" }).Build();
        var handler = new FakeHandler("{\"success\":true,\"hostname\":\"foodmatch.example\"}");
        var environment = new Mock<IWebHostEnvironment>();
        environment.SetupGet(e => e.EnvironmentName).Returns("Production");
        var verifier = new TurnstileVerifier(new HttpClient(handler), config, environment.Object);

        Assert.False(await verifier.VerifyAsync("test-token", CancellationToken.None));
        Assert.Equal(0, handler.RequestCount);
    }

    [Fact]
    public async Task MissingTokenDoesNotCallProvider()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Turnstile:SecretKey"] = "test-secret" }).Build();
        var handler = new FakeHandler("{\"success\":true}");
        var environment = new Mock<IWebHostEnvironment>();
        var verifier = new TurnstileVerifier(new HttpClient(handler), config, environment.Object);

        Assert.False(await verifier.VerifyAsync(null, CancellationToken.None));
        Assert.Equal(0, handler.RequestCount);
    }

    private sealed class FakeHandler(string json) : HttpMessageHandler
    {
        public int RequestCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal("https://challenges.cloudflare.com/turnstile/v0/siteverify",
                request.RequestUri?.ToString());
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json)
            });
        }
    }
}
