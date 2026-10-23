using FoodMatch.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodMatch.Infrastructure.Data;

public sealed class EfUnitOfWork(FoodMatchDbContext context) : IUnitOfWork
{
    public async Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await action();
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
