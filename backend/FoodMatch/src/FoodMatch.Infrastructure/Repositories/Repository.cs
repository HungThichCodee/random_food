using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using FoodMatch.Application.Interfaces;
using FoodMatch.Infrastructure.Data;

namespace FoodMatch.Infrastructure.Repositories;

/// <summary>
/// Generic repository implementation using EF Core.
/// </summary>
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly FoodMatchDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(FoodMatchDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    // TODO: Implement all IRepository<T> methods
    public Task<T?> GetByIdAsync(object id) => throw new NotImplementedException();
    public Task<IEnumerable<T>> GetAllAsync() => throw new NotImplementedException();
    public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate) => throw new NotImplementedException();
    public Task<T> AddAsync(T entity) => throw new NotImplementedException();
    public Task UpdateAsync(T entity) => throw new NotImplementedException();
    public Task DeleteAsync(T entity) => throw new NotImplementedException();
    public Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null) => throw new NotImplementedException();
}
