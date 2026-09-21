using System.Net;
using System.Text.Json;

namespace FoodMatch.Api.Middleware;

/// <summary>
/// Global exception handler middleware.
/// Catches unhandled exceptions and returns consistent error responses.
/// </summary>
public class GlobalExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
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
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            var response = JsonSerializer.Serialize(new { error = "An unexpected error occurred.", details = ex.Message });
            await context.Response.WriteAsync(response);
        }
    }
}
