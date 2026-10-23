using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace FoodMatch.Api.Services;

public record MeetingPlaceDto(string Id, string Name, string Category, double Lat, double Lng,
    int DistanceFromMiddleMeters);
public record MeetingSuggestionsDto(IReadOnlyList<MeetingPlaceDto> Places, string SearchUrl,
    bool ProviderAvailable, string EmbedUrl = "");

public interface IMeetingPlaceService
{
    Task<IReadOnlyList<MeetingPlaceDto>> SuggestAsync(
        double firstLat, double firstLng, double secondLat, double secondLng,
        CancellationToken cancellationToken);
}

public sealed class UnavailableMeetingPlaceService : IMeetingPlaceService
{
    public Task<IReadOnlyList<MeetingPlaceDto>> SuggestAsync(
        double firstLat, double firstLng, double secondLat, double secondLng,
        CancellationToken cancellationToken) =>
        throw new HttpRequestException("A dedicated Overpass provider is not configured.");
}

public sealed class MeetingPlaceService(HttpClient httpClient, IMemoryCache cache) : IMeetingPlaceService
{
    private const string ProviderPausedCacheKey = "meeting:provider-paused";

    public async Task<IReadOnlyList<MeetingPlaceDto>> SuggestAsync(
        double firstLat, double firstLng, double secondLat, double secondLng,
        CancellationToken cancellationToken)
    {
        if (!Valid(firstLat, firstLng) || !Valid(secondLat, secondLng))
            throw new ArgumentException("Invalid coordinates.");
        if (cache.TryGetValue(ProviderPausedCacheKey, out _))
            throw new HttpRequestException("Meeting place provider is temporarily paused.");

        // A search center is derived separately; users' stored coordinates are never changed.
        var centerLat = (firstLat + secondLat) / 2;
        var centerLng = (firstLng + secondLng) / 2;
        var cacheKey = $"meeting:{centerLat.ToString("R", CultureInfo.InvariantCulture)}:" +
            centerLng.ToString("R", CultureInfo.InvariantCulture);
        if (cache.TryGetValue(cacheKey, out IReadOnlyList<MeetingPlaceDto>? cached) && cached != null)
            return cached;

        var lat = centerLat.ToString("R", CultureInfo.InvariantCulture);
        var lng = centerLng.ToString("R", CultureInfo.InvariantCulture);
        var query = $"[out:json][timeout:8];nwr[\"amenity\"~\"^(restaurant|cafe|fast_food)$\"][\"name\"](around:1200,{lat},{lng});out center 50;";
        using var request = new HttpRequestMessage(HttpMethod.Post,
            httpClient.BaseAddress ?? throw new InvalidOperationException(
                "A dedicated Overpass endpoint is required."))
        {
            Content = new StringContent(query, Encoding.UTF8, "text/plain")
        };
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (response.StatusCode is System.Net.HttpStatusCode.NotAcceptable or
            System.Net.HttpStatusCode.TooManyRequests)
            cache.Set(ProviderPausedCacheKey, true, TimeSpan.FromSeconds(30));
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream,
            new JsonDocumentOptions { MaxDepth = 16 }, cancellationToken);

        var places = new List<MeetingPlaceDto>();
        if (document.RootElement.TryGetProperty("elements", out var elements) &&
            elements.ValueKind == JsonValueKind.Array)
        {
            foreach (var element in elements.EnumerateArray().Take(50))
            {
                if (!TryReadPlace(element, centerLat, centerLng, out var place))
                    continue;
                places.Add(place!);
            }
        }

        var result = places.OrderBy(place => place.DistanceFromMiddleMeters)
            .ThenBy(place => place.Name, StringComparer.OrdinalIgnoreCase)
            .Take(6).ToArray();
        cache.Set(cacheKey, result, TimeSpan.FromMinutes(5));
        return result;
    }

    private static bool TryReadPlace(JsonElement element, double centerLat, double centerLng,
        out MeetingPlaceDto? place)
    {
        place = null;
        if (!element.TryGetProperty("type", out var typeElement) ||
            !element.TryGetProperty("id", out var idElement) ||
            !element.TryGetProperty("tags", out var tags) ||
            !tags.TryGetProperty("name", out var nameElement) ||
            !tags.TryGetProperty("amenity", out var categoryElement))
            return false;

        var type = typeElement.GetString();
        var name = nameElement.GetString()?.Trim();
        var category = categoryElement.GetString();
        if (type is not ("node" or "way" or "relation") ||
            !idElement.TryGetInt64(out var id) || id <= 0 ||
            string.IsNullOrWhiteSpace(name) ||
            name.Length > 120 || category is not ("restaurant" or "cafe" or "fast_food"))
            return false;

        var position = element.TryGetProperty("center", out var center) ? center : element;
        if (!position.TryGetProperty("lat", out var latElement) ||
            !position.TryGetProperty("lon", out var lngElement) ||
            !latElement.TryGetDouble(out var lat) ||
            !lngElement.TryGetDouble(out var lng) || !Valid(lat, lng))
            return false;

        place = new MeetingPlaceDto($"{type}/{id}", name, category, lat, lng,
            (int)Math.Round(HaversineMeters(centerLat, centerLng, lat, lng)));
        return true;
    }

    private static bool Valid(double lat, double lng) =>
        double.IsFinite(lat) && double.IsFinite(lng) &&
        lat is >= -90 and <= 90 && lng is >= -180 and <= 180;

    private static double HaversineMeters(double lat1, double lng1, double lat2, double lng2)
    {
        const double earthRadius = 6371000;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLng = (lng2 - lng1) * Math.PI / 180;
        var a = Math.Pow(Math.Sin(dLat / 2), 2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Pow(Math.Sin(dLng / 2), 2);
        return earthRadius * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
