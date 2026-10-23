namespace FoodMatch.Application.Services;

internal static class NearbyDiscovery
{
    internal const double RadiusKm = 3.0;

    internal static bool Contains(double firstLat, double firstLng, double secondLat, double secondLng)
    {
        if (!ValidCoordinates(firstLat, firstLng) || !ValidCoordinates(secondLat, secondLng))
            return false;

        const double earthRadiusKm = 6371.0;
        var deltaLat = (secondLat - firstLat) * Math.PI / 180.0;
        var deltaLng = (secondLng - firstLng) * Math.PI / 180.0;
        var a = Math.Pow(Math.Sin(deltaLat / 2), 2) +
            Math.Cos(firstLat * Math.PI / 180.0) *
            Math.Cos(secondLat * Math.PI / 180.0) *
            Math.Pow(Math.Sin(deltaLng / 2), 2);
        var distanceKm = earthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return distanceKm <= RadiusKm;
    }

    private static bool ValidCoordinates(double lat, double lng) =>
        double.IsFinite(lat) && double.IsFinite(lng) &&
        lat is >= -90 and <= 90 && lng is >= -180 and <= 180;
}
