using System.Net;
using System.Text.Json;

namespace FoodMatch.Api.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception has occurred.");
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
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;

        var response = new
        {
            statusCode = context.Response.StatusCode,
            message = exception.Message,
            details = _env.IsDevelopment() ? exception.StackTrace : "An unexpected error occurred. Please try again later."
        };

        var jsonResponse = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(jsonResponse);
    }
}
