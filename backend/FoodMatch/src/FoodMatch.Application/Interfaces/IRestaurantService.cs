using FoodMatch.Application.DTOs.Restaurant;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FoodMatch.Application.Interfaces
{
    public interface IRestaurantService
    {
        Task<List<RestaurantResponseDto>> GetNearbyAsync(NearbyRequestDto request);
        Task<List<RestaurantResponseDto>> GetBuffetInMallAsync(NearbyRequestDto request);
    }
}
