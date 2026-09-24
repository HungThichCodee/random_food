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
// 4. SignalR
// 5. CORS
// 6. Swagger
// 7. Background services
// 8. HttpClient for external APIs

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
app.UseAuthorization();
app.MapControllers();

// TODO: Map SignalR hubs
// app.MapHub<LocationHub>("/hubs/location");
// app.MapHub<MatchHub>("/hubs/match");
// app.MapHub<ChatHub>("/hubs/chat");

app.Run();
