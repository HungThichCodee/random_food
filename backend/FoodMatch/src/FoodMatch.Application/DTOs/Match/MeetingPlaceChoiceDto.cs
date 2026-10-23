namespace FoodMatch.Application.DTOs.Match;

public sealed record MeetingPlaceChoiceDto(
    string Id, string Name, string Category, double? Lat, double? Lng,
    Guid ProposedByUserId, DateTime? AgreedAt, string? GoogleMapsUrl);

public sealed record MeetingPlaceSelection(
    string Id, string Name, string Category, double Lat, double Lng);

public sealed record SelectMeetingPlaceDto(string PlaceId);

public sealed record ProposeGoogleMeetingPlaceDto(string Name, string GoogleMapsUrl);
