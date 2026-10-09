using Microsoft.EntityFrameworkCore;
using FoodMatch.Infrastructure.Data;
using FoodMatch.Infrastructure.Repositories;
using FoodMatch.Application.Interfaces;
using Microsoft.AspNetCore.RateLimiting;
var builder = WebApplication.CreateBuilder(args);

// 1. DbContext with Npgsql
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<FoodMatchDbContext>(options =>
    options.UseNpgsql(connectionString)
           .ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// 2. Repository registrations
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// 3. Service registrations
builder.Services.AddScoped<IFoodService, FoodMatch.Application.Services.FoodService>();
    // Removed IRestaurantService
builder.Services.AddScoped<ITempUserService, FoodMatch.Application.Services.TempUserService>();
builder.Services.AddScoped<IMatchService, FoodMatch.Application.Services.MatchService>();
builder.Services.AddScoped<IChatService, FoodMatch.Application.Services.ChatService>();
builder.Services.AddScoped<IReportService, FoodMatch.Application.Services.ReportService>();
builder.Services.AddScoped<FoodMatch.Api.Services.IJwtTokenGenerator, FoodMatch.Api.Services.JwtTokenGenerator>();

// JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "SuperSecretKeyForFoodMatchApp12345!@#";
builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "FoodMatchApi",
            ValidAudience = builder.Configuration["JwtSettings:Audience"] ?? "FoodMatchClient",
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecret))
        };
        
        // SignalR Auth configuration
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
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
    options.AddFixedWindowLimiter("GeneralApi", opt =>
    {
        opt.PermitLimit = 60;
        opt.Window = TimeSpan.FromMinutes(1);
    });
    options.AddFixedWindowLimiter("CreateProfile", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
    });
    options.AddFixedWindowLimiter("ReportApi", opt =>
    {
        opt.PermitLimit = 3;
        opt.Window = TimeSpan.FromMinutes(1);
    });
});


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddSingleton<Microsoft.AspNetCore.SignalR.IUserIdProvider, FoodMatch.Api.Hubs.CustomUserIdProvider>();

// Health Checks
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString!);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5173") // Vite dev server
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
    
    // Auto-patch missing columns for Location Sharing (workaround for pending migrations)
    try 
    {
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"match_requests\" ADD COLUMN IF NOT EXISTS \"FromUserSharedLocation\" boolean NOT NULL DEFAULT FALSE;");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"match_requests\" ADD COLUMN IF NOT EXISTS \"ToUserSharedLocation\" boolean NOT NULL DEFAULT FALSE;");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"match_requests\" ADD COLUMN IF NOT EXISTS \"LocationSharedAt\" timestamp with time zone NULL;");
    } 
    catch (Exception ex) 
    {
        app.Logger.LogWarning(ex, "Could not auto-patch MatchRequests columns.");
    }

    await FoodMatch.Infrastructure.Data.Seed.DataSeeder.SeedAsync(context);
    app.Logger.LogInformation("Database migrated and seeded successfully.");
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Database connection/migration failed. Please ensure PostgreSQL is running via 'docker-compose up -d'.");
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<FoodMatch.Api.Middlewares.GlobalExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
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

app.MapHub<FoodMatch.Api.Hubs.LocationHub>("/hubs/location");
app.MapHub<FoodMatch.Api.Hubs.MatchHub>("/hubs/match");
app.MapHub<FoodMatch.Api.Hubs.ChatHub>("/hubs/chat");

app.Run();
