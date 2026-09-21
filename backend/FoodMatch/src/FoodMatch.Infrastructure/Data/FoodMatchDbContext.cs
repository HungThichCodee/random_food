using Microsoft.EntityFrameworkCore;
using FoodMatch.Domain.Entities;

namespace FoodMatch.Infrastructure.Data;

/// <summary>
/// EF Core DbContext for Food Match database.
/// </summary>
public class FoodMatchDbContext : DbContext
{
    public FoodMatchDbContext(DbContextOptions<FoodMatchDbContext> options) : base(options) { }

    public DbSet<Food> Foods => Set<Food>();
    public DbSet<FoodTag> FoodTags => Set<FoodTag>();
    public DbSet<FoodFoodTag> FoodFoodTags => Set<FoodFoodTag>();
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<TempUser> TempUsers => Set<TempUser>();
    public DbSet<MatchRequest> MatchRequests => Set<MatchRequest>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<FoodSuggestionLog> FoodSuggestionLogs => Set<FoodSuggestionLog>();
    public DbSet<UserReport> UserReports => Set<UserReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FoodMatchDbContext).Assembly);
    }
}
