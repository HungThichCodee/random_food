using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FoodMatch.Infrastructure.BackgroundJobs;

/// <summary>
/// Background service that periodically cleans up expired temp users.
/// Runs every 30 minutes.
/// </summary>
public class CleanupExpiredUsersService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CleanupExpiredUsersService> _logger;

    public CleanupExpiredUsersService(IServiceProvider serviceProvider, ILogger<CleanupExpiredUsersService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // TODO: Implement periodic cleanup (every 30 minutes)
        // 1. Create scope
        // 2. Get ITempUserService
        // 3. Call CleanupExpiredUsersAsync()
        // 4. Wait 30 minutes
        // 5. Repeat
        throw new NotImplementedException();
    }
}
