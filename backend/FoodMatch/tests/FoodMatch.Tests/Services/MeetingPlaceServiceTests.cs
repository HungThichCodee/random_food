using System.Net;
using System.Globalization;
using FoodMatch.Api.Services;
using Microsoft.Extensions.Caching.Memory;
using Xunit;

namespace FoodMatch.Tests.Services;

public class MeetingPlaceServiceTests
{
    [Fact]
    public async Task SuggestsNamedPlacesAroundTheMidpointAndCachesResults()
    {
        const string payload = """
        {
          "elements": [
            {"type":"node","id":1,"lat":10.2,"lon":106.2,
             "tags":{"name":"Quán giữa","amenity":"restaurant"}},
            {"type":"way","id":2,"center":{"lat":10.201,"lon":106.201},
             "tags":{"name":"Cà phê gần đó","amenity":"cafe"}},
            {"type":"node","id":3,"lat":10.2,"lon":106.2,
             "tags":{"amenity":"restaurant"}}
          ]
        }
        """;
        var handler = new FakeHandler(payload);
        var service = new MeetingPlaceService(ConfiguredClient(handler), new MemoryCache(new MemoryCacheOptions()));

        var first = await service.SuggestAsync(10.1, 106.1, 10.3, 106.3, CancellationToken.None);
        var second = await service.SuggestAsync(10.1, 106.1, 10.3, 106.3, CancellationToken.None);

        Assert.Equal(2, first.Count);
        Assert.Equal("Quán giữa", first[0].Name);
        Assert.Equal(10.2, first[0].Lat);
        Assert.Equal(106.2, first[0].Lng);
        Assert.Equal(0, first[0].DistanceFromMiddleMeters);
        Assert.Equal(first, second);
        Assert.Equal(1, handler.RequestCount);
        var coordinates = handler.Query.Split("around:1200,")[1].Split(')')[0].Split(',');
        var queryLat = double.Parse(coordinates[0], CultureInfo.InvariantCulture);
        var queryLng = double.Parse(coordinates[1], CultureInfo.InvariantCulture);
        Assert.InRange(Math.Abs(queryLat - 10.2), 0, 1e-12);
        Assert.InRange(Math.Abs(queryLng - 106.2), 0, 1e-12);
    }

    [Fact]
    public async Task RejectsInvalidCoordinatesBeforeCallingProvider()
    {
        var handler = new FakeHandler("{\"elements\":[]}");
        var service = new MeetingPlaceService(ConfiguredClient(handler), new MemoryCache(new MemoryCacheOptions()));

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.SuggestAsync(double.NaN, 106, 10, 106, CancellationToken.None));
        Assert.Equal(0, handler.RequestCount);
    }

    [Fact]
    public async Task PausesRequestsForThirtySecondsAfterProviderRejectsTraffic()
    {
        var handler = new FakeHandler("{}", HttpStatusCode.NotAcceptable);
        var service = new MeetingPlaceService(ConfiguredClient(handler),
            new MemoryCache(new MemoryCacheOptions()));

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            service.SuggestAsync(10.1, 106.1, 10.3, 106.3, CancellationToken.None));
        await Assert.ThrowsAsync<HttpRequestException>(() =>
            service.SuggestAsync(10.1, 106.1, 10.3, 106.3, CancellationToken.None));
        Assert.Equal(1, handler.RequestCount);
    }

    [Fact]
    public async Task NearbyMidpointsDoNotReuseAQueryForDifferentCoordinates()
    {
        var handler = new FakeHandler("{\"elements\":[]}");
        var service = new MeetingPlaceService(ConfiguredClient(handler),
            new MemoryCache(new MemoryCacheOptions()));

        await service.SuggestAsync(10.1, 106.1, 10.3, 106.3, CancellationToken.None);
        await service.SuggestAsync(10.1004, 106.1, 10.3, 106.3, CancellationToken.None);

        Assert.Equal(2, handler.RequestCount);
    }

    [Fact]
    public async Task NeverFallsBackToPublicOverpassWithoutConfiguredEndpoint()
    {
        var handler = new FakeHandler("{\"elements\":[]}");
        var service = new MeetingPlaceService(new HttpClient(handler),
            new MemoryCache(new MemoryCacheOptions()));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SuggestAsync(10.1, 106.1, 10.3, 106.3, CancellationToken.None));
        Assert.Equal(0, handler.RequestCount);
    }

    private static HttpClient ConfiguredClient(HttpMessageHandler handler) =>
        new(handler) { BaseAddress = new Uri("https://approved.example.test/interpreter") };

    private sealed class FakeHandler(string json, HttpStatusCode statusCode = HttpStatusCode.OK) : HttpMessageHandler
    {
        public int RequestCount { get; private set; }
        public string Query { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            Assert.Equal(HttpMethod.Post, request.Method);
            Query = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(json)
            };
        }
    }
}
