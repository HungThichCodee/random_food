using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Match;
using Microsoft.AspNetCore.SignalR;
using FoodMatch.Api.Hubs;

namespace FoodMatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requires JWT token
public class MatchRequestsController : ControllerBase
{
    private readonly IMatchService _matchService;
    private readonly IHubContext<MatchHub> _matchHubContext;

    public MatchRequestsController(IMatchService matchService, IHubContext<MatchHub> matchHubContext)
    {
        _matchService = matchService;
        _matchHubContext = matchHubContext;
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
            await _matchHubContext.Clients.User(dto.ToTempUserId.ToString())
                .SendAsync("MatchRequestReceived", result);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An error occurred.", Detailed = ex.Message });
        }
    }

    [HttpPut("{id}/respond")]
    [EnableRateLimiting("GeneralApi")]
    public async Task<ActionResult<MatchRequestDto>> Respond(int id, [FromBody] RespondMatchDto dto)
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var currentUserId))
                return Unauthorized();

            var result = await _matchService.RespondToRequestAsync(id, dto.Accept);

            // Notify the original sender
            await _matchHubContext.Clients.User(result.FromUserId.ToString())
                .SendAsync("MatchRequestResponded", result);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An error occurred.", Detailed = ex.Message });
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
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An error occurred.", Detailed = ex.Message });
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
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An error occurred.", Detailed = ex.Message });
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
            
            // Notify other user to update their state
            var buddyId = result.FromUserId == userId ? result.ToUserId : result.FromUserId;
            await _matchHubContext.Clients.User(buddyId.ToString())
                .SendAsync("LocationSharingUpdated", result);

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An error occurred.", Detailed = ex.Message });
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
            
            // Notify other user to update their state
            var buddyId = result.FromUserId == userId ? result.ToUserId : result.FromUserId;
            await _matchHubContext.Clients.User(buddyId.ToString())
                .SendAsync("LocationSharingUpdated", result);

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An error occurred.", Detailed = ex.Message });
        }
    }
}
