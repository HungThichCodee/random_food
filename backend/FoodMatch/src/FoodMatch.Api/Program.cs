using Microsoft.EntityFrameworkCore;
using FoodMatch.Infrastructure.Data;
using FoodMatch.Infrastructure.Repositories;
using FoodMatch.Application.Interfaces;
using Microsoft.AspNetCore.RateLimiting;
var builder = WebApplication.CreateBuilder(args);

// 1. DbContext with Npgsql
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<FoodMatchDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Repository registrations
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// 3. Service registrations
builder.Services.AddScoped<IFoodService, FoodMatch.Application.Services.FoodService>();
builder.Services.AddScoped<IRestaurantService, FoodMatch.Application.Services.RestaurantService>();
builder.Services.AddScoped<ITempUserService, FoodMatch.Application.Services.TempUserService>();
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

// 8. HttpClient for external APIs
builder.Services.AddHttpClient<IOverpassApiService, FoodMatch.Infrastructure.Services.OverpassApiService>();
builder.Services.AddHttpClient<IRoutingService, FoodMatch.Infrastructure.ExternalApis.OsrmRoutingService>();

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
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<FoodMatchDbContext>();
    await context.Database.MigrateAsync();
    await FoodMatch.Infrastructure.Data.Seed.DataSeeder.SeedAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// TODO: Map SignalR hubs
app.MapHub<FoodMatch.Api.Hubs.LocationHub>("/hubs/location");
app.MapHub<FoodMatch.Api.Hubs.MatchHub>("/hubs/match");
app.MapHub<FoodMatch.Api.Hubs.ChatHub>("/hubs/chat");

app.Run();
