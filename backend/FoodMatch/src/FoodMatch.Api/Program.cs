using FoodMatch.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// TODO: Add services
// 1. DbContext with Npgsql
// 2. Repository registrations
// 3. Service registrations
// 4. SignalR
// 5. CORS
// 6. Swagger
// 7. Background services
// 8. HttpClient for external APIs

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

// TODO: Map SignalR hubs
// app.MapHub<LocationHub>("/hubs/location");
// app.MapHub<MatchHub>("/hubs/match");
// app.MapHub<ChatHub>("/hubs/chat");

app.Run();
