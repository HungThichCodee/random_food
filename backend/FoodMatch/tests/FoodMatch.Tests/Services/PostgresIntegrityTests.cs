using FoodMatch.Domain.Entities;
using FoodMatch.Domain.Enums;
using FoodMatch.Infrastructure.Data;
using FoodMatch.Infrastructure.Data.Seed;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Xunit;

namespace FoodMatch.Tests.Services;

// Set FOODMATCH_TEST_CONNECTION to a migrated, disposable PostgreSQL database.
public sealed class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("FOODMATCH_TEST_CONNECTION")))
            Skip = "Requires a disposable FOODMATCH_TEST_CONNECTION database.";
    }
}

public class PostgresIntegrityTests
{
    [PostgresFact]
    public async Task SeederRecoversFromTagsWithoutFoodsAndRemainsIdempotent()
    {
        await using var context = new FoodMatchDbContext(Options());
        Assert.False(await context.Foods.AnyAsync());
        context.FoodTags.Add(new FoodTag { Name = "Cay" });
        await context.SaveChangesAsync();

        await DataSeeder.SeedAsync(context);

        var foodCount = await context.Foods.CountAsync();
        Assert.True(foodCount >= 50);
        Assert.Equal(1, await context.FoodTags.CountAsync(tag => tag.Name == "Cay"));

        await DataSeeder.SeedAsync(context);
        Assert.Equal(foodCount, await context.Foods.CountAsync());
        Assert.Equal(1, await context.FoodTags.CountAsync(tag => tag.Name == "Cay"));
    }

    private static DbContextOptions<FoodMatchDbContext> Options()
    {
        var connection = Environment.GetEnvironmentVariable("FOODMATCH_TEST_CONNECTION")
            ?? throw new InvalidOperationException("FOODMATCH_TEST_CONNECTION is required.");
        var parsed = new NpgsqlConnectionStringBuilder(connection);
        if (string.IsNullOrWhiteSpace(parsed.Database) ||
            !parsed.Database.StartsWith("foodmatch_test_", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Integration tests require a foodmatch_test_ database.");
        return new DbContextOptionsBuilder<FoodMatchDbContext>().UseNpgsql(connection).Options;
    }

    private static TempUser NewUser() => new()
    {
        Id = Guid.NewGuid(), SessionToken = Guid.NewGuid().ToString("N"),
        DisplayName = "Integrity test", CreatedAt = DateTime.UtcNow,
        ExpiresAt = DateTime.UtcNow.AddHours(1), Status = UserStatus.Available
    };

    [PostgresFact]
    public async Task UnitOfWorkRollsBackAllWritesOnFailure()
    {
        var options = Options();
        var first = NewUser();
        var second = NewUser();
        await using (var context = new FoodMatchDbContext(options))
        {
            var unit = new EfUnitOfWork(context);
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                unit.ExecuteInTransactionAsync(async () =>
                {
                    context.TempUsers.Add(first);
                    await context.SaveChangesAsync();
                    context.TempUsers.Add(second);
                    await context.SaveChangesAsync();
                    throw new InvalidOperationException("rollback probe");
                }));
        }

        await using var verify = new FoodMatchDbContext(options);
        Assert.False(await verify.TempUsers.AnyAsync(user =>
            user.Id == first.Id || user.Id == second.Id));
    }

    [PostgresFact]
    public async Task MatchRowVersionRejectsStaleConcurrentWrite()
    {
        var options = Options();
        var from = NewUser();
        var to = NewUser();
        int matchId = 0;
        try
        {
            await using (var seed = new FoodMatchDbContext(options))
            {
                seed.TempUsers.AddRange(from, to);
                var match = new MatchRequest
                {
                    FromTempUserId = from.Id, ToTempUserId = to.Id,
                    Status = MatchStatus.Accepted
                };
                seed.MatchRequests.Add(match);
                await seed.SaveChangesAsync();
                matchId = match.Id;
            }

            await using var first = new FoodMatchDbContext(options);
            await using var second = new FoodMatchDbContext(options);
            var current = await first.MatchRequests.SingleAsync(match => match.Id == matchId);
            var stale = await second.MatchRequests.SingleAsync(match => match.Id == matchId);
            current.FromUserSharedLocation = true;
            await first.SaveChangesAsync();
            stale.ToUserSharedLocation = true;
            await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());

            await using var verify = new FoodMatchDbContext(options);
            var persisted = await verify.MatchRequests.SingleAsync(match => match.Id == matchId);
            Assert.True(persisted.FromUserSharedLocation);
            Assert.False(persisted.ToUserSharedLocation);
        }
        finally
        {
            await using var cleanup = new FoodMatchDbContext(options);
            var match = await cleanup.MatchRequests.FindAsync(matchId);
            if (match != null) cleanup.MatchRequests.Remove(match);
            var users = await cleanup.TempUsers.Where(user =>
                user.Id == from.Id || user.Id == to.Id).ToListAsync();
            cleanup.TempUsers.RemoveRange(users);
            await cleanup.SaveChangesAsync();
        }
    }
}
