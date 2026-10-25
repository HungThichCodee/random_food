using Microsoft.EntityFrameworkCore;
using FoodMatch.Infrastructure.Data;
using FoodMatch.Infrastructure.Repositories;
using FoodMatch.Application.Interfaces;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using System.Security.Claims;
using FoodMatch.Api.Configuration;
RootEnvironment.Load();
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 64 * 1024);
// Browser SignalR transports can put the bearer token in the URL query string.
builder.Logging.AddFilter("Microsoft.AspNetCore.Hosting", LogLevel.Warning);

// 1. DbContext with Npgsql
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings__DefaultConnection must be set in the root .env or deployment environment.");
builder.Services.AddDbContext<FoodMatchDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Repository registrations
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, EfUnitOfWork>();

// 3. Service registrations
builder.Services.AddScoped<IFoodService, FoodMatch.Application.Services.FoodService>();
    // Removed IRestaurantService
builder.Services.AddScoped<ITempUserService, FoodMatch.Application.Services.TempUserService>();
builder.Services.AddScoped<IMatchService, FoodMatch.Application.Services.MatchService>();
builder.Services.AddScoped<IChatService, FoodMatch.Application.Services.ChatService>();
builder.Services.AddScoped<IReportService, FoodMatch.Application.Services.ReportService>();
builder.Services.AddScoped<FoodMatch.Api.Services.IJwtTokenGenerator, FoodMatch.Api.Services.JwtTokenGenerator>();
builder.Services.AddHttpClient<FoodMatch.Api.Services.ICaptchaVerifier, FoodMatch.Api.Services.TurnstileVerifier>(
    client => client.Timeout = TimeSpan.FromSeconds(5));
builder.Services.AddMemoryCache();
var overpassEndpoint = builder.Configuration["MeetingPlaces:OverpassUrl"]?.Trim();
if (!string.IsNullOrWhiteSpace(overpassEndpoint))
{
    if (!Uri.TryCreate(overpassEndpoint, UriKind.Absolute, out var overpassUri) ||
        overpassUri.Scheme != Uri.UriSchemeHttps || overpassUri.UserInfo.Length > 0 ||
        overpassUri.Query.Length > 0 || overpassUri.Fragment.Length > 0 ||
        string.Equals(overpassUri.IdnHost.TrimEnd('.'), "overpass-api.de",
            StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException(
            "MeetingPlaces__OverpassUrl must be an approved HTTPS interpreter endpoint, not the public default.");

    builder.Services.AddHttpClient<FoodMatch.Api.Services.IMeetingPlaceService, FoodMatch.Api.Services.MeetingPlaceService>(
        client =>
        {
            client.BaseAddress = overpassUri;
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("FoodMatch/1.0");
        });
}
else
    builder.Services.AddScoped<FoodMatch.Api.Services.IMeetingPlaceService,
        FoodMatch.Api.Services.UnavailableMeetingPlaceService>();

var turnstileHostnames = FoodMatch.Api.Services.TurnstileVerifier.ParseAllowedHostnames(
    builder.Configuration["Turnstile:Hostname"]);
if (builder.Environment.IsProduction() &&
    (string.IsNullOrWhiteSpace(builder.Configuration["Turnstile:SecretKey"]) ||
     turnstileHostnames.Count == 0 || turnstileHostnames.Contains("localhost") ||
     new[]
     {
         "1x0000000000000000000000000000000AA",
         "2x0000000000000000000000000000000AA",
         "3x0000000000000000000000000000000AA"
     }.Contains(builder.Configuration["Turnstile:SecretKey"])))
    throw new InvalidOperationException("Production requires a real Turnstile__SecretKey and Turnstile__Hostname.");

// JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || System.Text.Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    throw new InvalidOperationException("JwtSettings__Secret must contain at least 32 bytes in the root .env or deployment environment.");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"]
    ?? throw new InvalidOperationException("JwtSettings__Issuer is required.");
var jwtAudience = builder.Configuration["JwtSettings:Audience"]
    ?? throw new InvalidOperationException("JwtSettings__Audience is required.");
builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecret))
        };
        
        // SignalR Auth configuration
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnChallenge = context =>
            {
                LogSecurityEvent(context.HttpContext, "authentication_denied");
                return Task.CompletedTask;
            },
            OnForbidden = context =>
            {
                LogSecurityEvent(context.HttpContext, "authorization_denied");
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// 4. SignalR
// 5. CORS
// 6. Swagger
// 7. Background services
builder.Services.AddHostedService<FoodMatch.Api.HostedServices.ExpiredUserCleanupService>();

// Removed External APIs

// Rate Limiting (Anti-spam)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = ClientIpRateLimiter.Create();
    options.AddPolicy("GeneralApi", context => PerIpWindow(context, 60));
    options.AddPolicy("CreateProfile", context => PerIpWindow(context, 10));
    options.AddPolicy("ReportApi", context => PerIpWindow(context, 3));
    options.AddPolicy("SignalRConnect", context => PerIpWindow(context, 20));
    options.AddPolicy("MeetingSuggestions", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            RateLimitKey(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 6,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.OnRejected = async (context, cancellationToken) =>
    {
        LogSecurityEvent(context.HttpContext, "rate_limit_denied");
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            context.HttpContext.Response.Headers.RetryAfter =
                Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Too many requests. Try again later." }, cancellationToken);
    };
});

static RateLimitPartition<string> PerIpWindow(HttpContext context, int permitLimit) =>
    RateLimitPartition.GetFixedWindowLimiter(
        RateLimitKey(context),
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permitLimit,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        });

static string RateLimitKey(HttpContext context)
{
    var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (Guid.TryParse(userId, out var parsedUserId))
        return $"user:{parsedUserId}";

    return ClientIpRateLimiter.GetKey(context);
}

static void LogSecurityEvent(HttpContext context, string reason)
{
    var claimedId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    var actor = Guid.TryParse(claimedId, out var id) ? id.ToString() : "anonymous";
    var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
        .CreateLogger("SecurityEvents");
    logger.LogWarning("Security event {Reason} for actor {ActorId} at {UtcTime:o}",
        reason, actor, DateTime.UtcNow);
}


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddSingleton<Microsoft.AspNetCore.SignalR.IUserIdProvider, FoodMatch.Api.Hubs.CustomUserIdProvider>();

// Health Checks
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString!);

// CORS
var corsOrigins = builder.Configuration["Cors:Origins"]
    ?? throw new InvalidOperationException("Cors__Origins is required.");
var allowedCorsOrigins = corsOrigins.Split(',',
    StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
if (allowedCorsOrigins.Length == 0 || allowedCorsOrigins.Any(origin =>
        !Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
        uri.UserInfo.Length > 0 || uri.AbsolutePath != "/" ||
        uri.Query.Length > 0 || uri.Fragment.Length > 0 ||
        origin.EndsWith('/') ||
        (builder.Environment.IsProduction() && uri.Scheme != Uri.UriSchemeHttps)))
    throw new InvalidOperationException("Cors__Origins must contain exact, approved HTTPS origins.");
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(allowedCorsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

var app = builder.Build();

// Auto-migrate and Seed Data on startup
try
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<FoodMatchDbContext>();
    await context.Database.MigrateAsync();
    
    await FoodMatch.Infrastructure.Data.Seed.DataSeeder.SeedAsync(context);
    app.Logger.LogInformation("Database migrated and seeded successfully.");
}
catch (Exception ex)
{
    app.Logger.LogCritical("Database connection or migration failed during startup: {ErrorType} at {UtcTime:o}",
        ex.GetType().Name, DateTime.UtcNow);
    throw;
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<FoodMatch.Api.Middlewares.GlobalExceptionMiddleware>();
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api") ||
        context.Request.Path.StartsWithSegments("/hubs"))
        context.Response.Headers.CacheControl = "no-store";
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()";
    if (app.Environment.IsProduction())
        context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000";
    await next();
});
// Render already redirects public HTTP to HTTPS before forwarding HTTP internally.
if (!string.Equals(Environment.GetEnvironmentVariable("RENDER"), "true",
    StringComparison.OrdinalIgnoreCase))
    app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/hubs") &&
        string.Equals(context.Request.Headers["Upgrade"].ToString(), "websocket",
            StringComparison.OrdinalIgnoreCase))
    {
        var origin = context.Request.Headers["Origin"].ToString();
        if (!string.IsNullOrEmpty(origin) &&
            !allowedCorsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
        {
            LogSecurityEvent(context, "websocket_origin_denied");
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }
    }
    await next();
});
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.MapControllers();

// Health Check Endpoints
app.MapHealthChecks("/api/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var response = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            dependencies = report.Entries.Select(e => new { key = e.Key, status = e.Value.Status.ToString() })
        };
        await context.Response.WriteAsJsonAsync(response);
    }
});

app.MapHub<FoodMatch.Api.Hubs.MatchHub>("/hubs/match",
        options => options.CloseOnAuthenticationExpiration = true)
    .RequireRateLimiting("SignalRConnect");
app.MapHub<FoodMatch.Api.Hubs.ChatHub>("/hubs/chat",
        options => options.CloseOnAuthenticationExpiration = true)
    .RequireRateLimiting("SignalRConnect");

app.Run();
