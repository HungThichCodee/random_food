using System.Net;
using System.Text.Json;
using System.Security.Claims;

namespace FoodMatch.Api.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var claimedId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var actor = Guid.TryParse(claimedId, out var id) ? id.ToString() : "anonymous";
            _logger.LogError("Unhandled {ExceptionType} for actor {ActorId} at {UtcTime:o}",
                ex.GetType().Name, actor, DateTime.UtcNow);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        // Define appropriate status code based on exception type if necessary
        // Default to 500
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        if (exception is ArgumentException)
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        else if (exception is KeyNotFoundException)
            context.Response.StatusCode = (int)HttpStatusCode.NotFound;
        else if (exception is UnauthorizedAccessException)
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;

        var response = new
        {
            statusCode = context.Response.StatusCode,
            message = context.Response.StatusCode switch
            {
                400 => "Invalid request.",
                403 => "Access denied.",
                404 => "Resource not found.",
                _ => "An unexpected error occurred."
            }
        };

        var jsonResponse = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(jsonResponse);
    }
}
