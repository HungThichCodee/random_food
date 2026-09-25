using FoodMatch.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FoodMatch.Application.Interfaces
{
    public interface IOverpassApiService
    {
        Task<List<Restaurant>> FetchNearbyRestaurantsAsync(double latitude, double longitude, double radius);
    }
}
