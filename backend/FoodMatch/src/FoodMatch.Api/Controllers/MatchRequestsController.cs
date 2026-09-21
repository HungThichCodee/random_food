using Microsoft.AspNetCore.Mvc;
using FoodMatch.Application.Interfaces;
using FoodMatch.Application.DTOs.Match;

namespace FoodMatch.Api.Controllers;

/// <summary>
/// API controller for social dining match requests.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MatchRequestsController : ControllerBase
{
    private readonly IMatchService _matchService;

    public MatchRequestsController(IMatchService matchService)
    {
        _matchService = matchService;
    }

    [HttpPost]
    public async Task<ActionResult<MatchRequestDto>> Create([FromHeader(Name = "X-User-Id")] Guid fromUserId, [FromBody] CreateMatchRequestDto dto)
    {
        // TODO: Call _matchService.SendMatchRequestAsync
        throw new NotImplementedException();
    }

    [HttpPut("{id}/respond")]
    public async Task<ActionResult<MatchRequestDto>> Respond(int id, [FromBody] bool accept)
    {
        // TODO: Call _matchService.RespondToRequestAsync
        throw new NotImplementedException();
    }

    [HttpGet("pending")]
    public async Task<ActionResult<List<MatchRequestDto>>> GetPending([FromHeader(Name = "X-User-Id")] Guid userId)
    {
        // TODO: Call _matchService.GetPendingRequestsAsync
        throw new NotImplementedException();
    }
}
