using System.Net;
using System.Threading.RateLimiting;

namespace FoodMatch.Api.Configuration;

public static class ClientIpRateLimiter
{
    public const int RequestsPerMinute = 240;

    public static PartitionedRateLimiter<HttpContext> Create() =>
        PartitionedRateLimiter.Create<HttpContext, string>(context =>
        {
            if (string.Equals(context.Request.Path.Value, "/api/health",
                    StringComparison.OrdinalIgnoreCase))
                return RateLimitPartition.GetNoLimiter("health");

            return RateLimitPartition.GetFixedWindowLimiter(
                GetKey(context), _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = RequestsPerMinute,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
        });

    public static string GetKey(HttpContext context)
    {
        // Render's public edge overwrites this header. Ignore it elsewhere, where
        // a caller could set it directly. Never use the spoofable X-Forwarded-For list.
        if (string.Equals(Environment.GetEnvironmentVariable("RENDER"), "true",
                StringComparison.OrdinalIgnoreCase) &&
            IPAddress.TryParse(context.Request.Headers["CF-Connecting-IP"].ToString(),
                out var clientIp))
            return $"ip:{clientIp}";

        return $"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";
    }
}
