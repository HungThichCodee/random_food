using FoodMatch.Domain.Entities;
using FoodMatch.Infrastructure.Data;

namespace FoodMatch.Infrastructure.Data.Seed;

/// <summary>
/// Seeds initial data: 50 Vietnamese dishes + food tags.
/// </summary>
public static class DataSeeder
{
    /// <summary>
    /// Seeds food tags and 50 Vietnamese dishes into the database.
    /// Called during application startup or migration.
    /// </summary>
    public static async Task SeedAsync(FoodMatchDbContext context)
    {
        // TODO: Implement seeding logic
        // 1. Seed food tags: cay, chay, healthy, ngot, man, chien, hap, nuong, hai_san, thit, rau, do_uong
        // 2. Seed 50 Vietnamese dishes with proper category, cuisine_type, price_range, meal_time
        // 3. Seed food-tag relationships
        throw new NotImplementedException();
    }
}
