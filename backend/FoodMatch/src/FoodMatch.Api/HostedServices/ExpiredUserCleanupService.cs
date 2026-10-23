using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using FoodMatch.Application.Interfaces;

namespace FoodMatch.Api.HostedServices;

public class ExpiredUserCleanupService(
    IServiceProvider serviceProvider,
    ILogger<ExpiredUserCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ExpiredUserCleanupService is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var tempUserService = scope.ServiceProvider.GetRequiredService<ITempUserService>();

                logger.LogInformation("Running cleanup for expired TempUsers...");
                await tempUserService.CleanupExpiredUsersAsync();
            }
            catch (Exception ex)
            {
                logger.LogError("Expired user cleanup failed: {ErrorType} at {UtcTime:o}",
                    ex.GetType().Name, DateTime.UtcNow);
            }

            // Run every 10 minutes
            await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
        }
    }
}
