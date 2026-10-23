using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Match;
using Microsoft.AspNetCore.SignalR;
using FoodMatch.Api.Hubs;
using Microsoft.EntityFrameworkCore;

namespace FoodMatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requires JWT token
[EnableRateLimiting("GeneralApi")]
public class MatchRequestsController : ControllerBase
{
    private readonly IMatchService _matchService;
    private readonly IHubContext<MatchHub> _matchHubContext;
    private readonly ITempUserService _tempUserService;
    private readonly FoodMatch.Api.Services.IMeetingPlaceService _meetingPlaceService;
    private readonly string? _googleMapsEmbedApiKey;

    public MatchRequestsController(IMatchService matchService, IHubContext<MatchHub> matchHubContext,
        ITempUserService tempUserService, FoodMatch.Api.Services.IMeetingPlaceService meetingPlaceService,
        IConfiguration? configuration = null)
    {
        _matchService = matchService;
        _matchHubContext = matchHubContext;
        _tempUserService = tempUserService;
        _meetingPlaceService = meetingPlaceService;
        _googleMapsEmbedApiKey = configuration?["GoogleMaps:EmbedApiKey"]?.Trim();
    }

    [HttpPost]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<MatchRequestDto>> SendRequest([FromBody] CreateMatchRequestDto dto)
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var fromUserId))
                return Unauthorized();

            var result = await _matchService.SendMatchRequestAsync(fromUserId, dto);
            
            // Notify target user via SignalR
            await NotifyBestEffortAsync("MatchRequestReceived", () =>
                _matchHubContext.Clients.User(dto.ToTempUserId.ToString())
                    .SendAsync("MatchRequestReceived", result));

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An error occurred." });
        }
    }

    [HttpPut("{id}/respond")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<MatchRequestDto>> Respond(int id, [FromBody] RespondMatchDto dto)
    {
        if (dto?.Accept is not bool accept)
            return BadRequest(new { Message = "Accept is required." });
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var currentUserId))
                return Unauthorized();

            var result = await _matchService.RespondToRequestAsync(id, currentUserId, accept);

            // Notify the original sender
            await NotifyBestEffortAsync("MatchRequestResponded", () =>
                _matchHubContext.Clients.User(result.FromUserId.ToString())
                    .SendAsync("MatchRequestResponded", result));

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { Message = "Match changed. Refresh and try again." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An error occurred." });
        }
    }

    [HttpGet("pending")]
    public async Task<ActionResult<List<MatchRequestDto>>> GetPendingRequests()
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var currentUserId))
                return Unauthorized();

            var result = await _matchService.GetPendingRequestsAsync(currentUserId);
            return Ok(result);
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An error occurred." });
        }
    }

    [HttpGet("active")]
    public async Task<ActionResult<MatchRequestDto>> GetActiveMatch()
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var currentUserId))
                return Unauthorized();

            var result = await _matchService.GetActiveMatchAsync(currentUserId);
            if (result == null)
                return NotFound(new { Message = "No active match found." });

            return Ok(result);
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An error occurred." });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MatchRequestDto>> GetMatch(int id)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        try
        {
            return Ok(await _matchService.GetMatchForUserAsync(id, userId));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("{id:int}/meeting-suggestions")]
    [EnableRateLimiting("MeetingSuggestions")]
    public async Task<ActionResult<FoodMatch.Api.Services.MeetingSuggestionsDto>> GetMeetingSuggestions(
        int id, [FromQuery] string? kind = null)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        var searchKind = kind?.Trim().ToLowerInvariant() ?? "restaurant";
        var googleQuery = searchKind switch
        {
            "restaurant" => "quán ăn",
            "cafe" => "quán cà phê",
            "vegetarian" => "quán chay",
            "dessert" => "quán chè bánh ngọt",
            _ => null
        };
        if (googleQuery == null) return BadRequest(new { Message = "Unsupported meeting search kind." });
        try
        {
            var match = await _matchService.GetMatchForUserAsync(id, userId);
            if (match.Status != "Accepted" || !match.HasSharedLocation ||
                !match.BuddyHasSharedLocation ||
                !match.BuddyLat.HasValue || !match.BuddyLng.HasValue)
                return Forbid();

            var caller = await _tempUserService.GetByIdAsync(userId);
            if (caller?.CurrentLat == null || caller.CurrentLng == null)
                return Conflict(new { Message = "Update your location first." });

            IReadOnlyList<FoodMatch.Api.Services.MeetingPlaceDto> places;
            var providerAvailable = searchKind == "restaurant";
            try
            {
                places = searchKind == "restaurant"
                    ? await _meetingPlaceService.SuggestAsync(
                        caller.CurrentLat.Value, caller.CurrentLng.Value,
                        match.BuddyLat.Value, match.BuddyLng.Value, HttpContext.RequestAborted)
                    : Array.Empty<FoodMatch.Api.Services.MeetingPlaceDto>();
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException)
            {
                places = Array.Empty<FoodMatch.Api.Services.MeetingPlaceDto>();
                providerAvailable = false;
            }

            var latest = await _matchService.GetMatchForUserAsync(id, userId);
            if (!CanUseMeetingPlaces(latest)) return Forbid();
            var latestCaller = await _tempUserService.GetByIdAsync(userId);
            if (latestCaller?.CurrentLat == null || latestCaller.CurrentLng == null)
                return Conflict(new { Message = "Update your location first." });

            if (caller.CurrentLat != latestCaller.CurrentLat ||
                caller.CurrentLng != latestCaller.CurrentLng ||
                match.BuddyLat != latest.BuddyLat || match.BuddyLng != latest.BuddyLng)
            {
                // Places from the old midpoint are stale; Google Maps uses the fresh one.
                places = Array.Empty<FoodMatch.Api.Services.MeetingPlaceDto>();
                providerAvailable = false;
            }

            var centerLat = (latestCaller.CurrentLat.Value + latest.BuddyLat!.Value) / 2;
            var centerLng = (latestCaller.CurrentLng.Value + latest.BuddyLng!.Value) / 2;
            var centerText = $"{centerLat.ToString("R", System.Globalization.CultureInfo.InvariantCulture)},{centerLng.ToString("R", System.Globalization.CultureInfo.InvariantCulture)}";
            var searchTerm = $"{googleQuery} gần {centerText}";
            var searchUrl = "https://www.google.com/maps/search/?api=1&query=" +
                Uri.EscapeDataString(searchTerm);
            var embedUrl = string.IsNullOrWhiteSpace(_googleMapsEmbedApiKey)
                ? "https://maps.google.com/maps?q=" +
                    Uri.EscapeDataString(searchTerm) + "&ll=" + centerText + "&z=15&output=embed"
                : "https://www.google.com/maps/embed/v1/search?key=" +
                    Uri.EscapeDataString(_googleMapsEmbedApiKey) + "&q=" +
                    Uri.EscapeDataString(googleQuery) + "&center=" +
                    Uri.EscapeDataString(centerText) + "&zoom=15&language=vi";
            return Ok(new FoodMatch.Api.Services.MeetingSuggestionsDto(
                places, searchUrl, providerAvailable, embedUrl));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id:int}/meeting-place")]
    [EnableRateLimiting("MeetingSuggestions")]
    public async Task<ActionResult<MatchRequestDto>> ProposeMeetingPlace(int id,
        [FromBody] SelectMeetingPlaceDto dto)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        if (dto == null || string.IsNullOrWhiteSpace(dto.PlaceId) || dto.PlaceId.Length > 64)
            return BadRequest(new { Message = "Invalid place ID." });
        try
        {
            var match = await _matchService.GetMatchForUserAsync(id, userId);
            if (!CanUseMeetingPlaces(match)) return Forbid();
            var caller = await _tempUserService.GetByIdAsync(userId);
            if (caller?.CurrentLat == null || caller.CurrentLng == null) return Forbid();

            var places = await _meetingPlaceService.SuggestAsync(
                caller.CurrentLat.Value, caller.CurrentLng.Value,
                match.BuddyLat!.Value, match.BuddyLng!.Value, HttpContext.RequestAborted);
            var selected = places.FirstOrDefault(place => place.Id == dto.PlaceId);
            if (selected == null)
                return BadRequest(new { Message = "Choose a current suggested place." });

            var result = await _matchService.ProposeMeetingPlaceAsync(id, userId,
                new MeetingPlaceSelection(selected.Id, selected.Name, selected.Category,
                    selected.Lat, selected.Lng));
            await NotifyMeetingPlaceUpdatedAsync(id, userId, result);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (ArgumentException) { return BadRequest(new { Message = "Invalid meeting place." }); }
        catch (DbUpdateConcurrencyException) { return Conflict(new { Message = "Meeting place changed. Refresh and try again." }); }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException)
        { return StatusCode(503, new { Message = "Meeting place suggestions are temporarily unavailable." }); }
    }

    [HttpPost("{id:int}/meeting-place/confirm")]
    [EnableRateLimiting("MeetingSuggestions")]
    public async Task<ActionResult<MatchRequestDto>> ConfirmMeetingPlace(int id,
        [FromBody] SelectMeetingPlaceDto dto)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        if (dto == null || string.IsNullOrWhiteSpace(dto.PlaceId) || dto.PlaceId.Length > 64)
            return BadRequest(new { Message = "Invalid place ID." });
        try
        {
            var result = await _matchService.ConfirmMeetingPlaceAsync(id, userId, dto.PlaceId);
            await NotifyMeetingPlaceUpdatedAsync(id, userId, result);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException) { return Conflict(new { Message = "Meeting place proposal changed." }); }
        catch (DbUpdateConcurrencyException) { return Conflict(new { Message = "Meeting place changed. Refresh and try again." }); }
    }

    [HttpPost("{id:int}/meeting-place/google")]
    [EnableRateLimiting("MeetingSuggestions")]
    public async Task<ActionResult<MatchRequestDto>> ProposeGoogleMeetingPlace(int id,
        [FromBody] ProposeGoogleMeetingPlaceDto dto)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        try
        {
            var result = await _matchService.ProposeGoogleMeetingPlaceAsync(id, userId, dto);
            await NotifyMeetingPlaceUpdatedAsync(id, userId, result);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (ArgumentException) { return BadRequest(new { Message = "Enter a valid Google Maps place name and link." }); }
        catch (DbUpdateConcurrencyException) { return Conflict(new { Message = "Meeting place changed. Refresh and try again." }); }
    }

    private static bool CanUseMeetingPlaces(MatchRequestDto match) =>
        match.Status == "Accepted" && match.HasSharedLocation &&
        match.BuddyHasSharedLocation && match.BuddyLat.HasValue && match.BuddyLng.HasValue;

    private async Task NotifyMeetingPlaceUpdatedAsync(int id, Guid userId, MatchRequestDto result)
    {
        await NotifyBestEffortAsync("MeetingPlaceUpdated", async () =>
        {
            var buddyId = result.FromUserId == userId ? result.ToUserId : result.FromUserId;
            var buddyResult = await _matchService.GetMatchForUserAsync(id, buddyId);
            await _matchHubContext.Clients.User(buddyId.ToString())
                .SendAsync("MeetingPlaceUpdated", buddyResult);
        });
    }

    private async Task NotifyLocationSharingUpdatedAsync(int id, Guid userId, MatchRequestDto result)
    {
        await NotifyBestEffortAsync("LocationSharingUpdated", async () =>
        {
            var buddyId = result.FromUserId == userId ? result.ToUserId : result.FromUserId;
            var buddyResult = await _matchService.GetMatchForUserAsync(id, buddyId);
            await _matchHubContext.Clients.User(buddyId.ToString())
                .SendAsync("LocationSharingUpdated", buddyResult);
        });
    }

    private async Task NotifyBestEffortAsync(string eventName, Func<Task> send)
    {
        try
        {
            await send();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // The database change is committed; clients also refresh state periodically.
            HttpContext.RequestServices.GetService<ILogger<MatchRequestsController>>()?
                .LogWarning("{EventName} notification failed: {ErrorType} at {UtcTime:o}",
                    eventName, ex.GetType().Name, DateTime.UtcNow);
        }
    }

    [HttpPost("{id}/share-location")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<MatchRequestDto>> ShareLocation(int id)
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            var result = await _matchService.ShareLocationAsync(id, userId);
            
            await NotifyLocationSharingUpdatedAsync(id, userId, result);

            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { Message = "Match changed. Refresh and try again." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An error occurred." });
        }
    }

    [HttpPost("{id}/stop-sharing-location")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<MatchRequestDto>> StopSharingLocation(int id)
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            var result = await _matchService.StopSharingLocationAsync(id, userId);
            
            await NotifyLocationSharingUpdatedAsync(id, userId, result);

            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { Message = "Match changed. Refresh and try again." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An error occurred." });
        }
    }
}
