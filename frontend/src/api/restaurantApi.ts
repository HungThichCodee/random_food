import apiClient from './axiosClient';
import type { RestaurantDto } from '../types/restaurant';

// TODO: Implement API calls
export const restaurantApi = {
  getNearby: async (lat: number, lng: number, radius: number = 2000): Promise<RestaurantDto[]> => {
    return await apiClient.get<RestaurantDto[], RestaurantDto[]>('/restaurants/nearby', {
      params: { latitude: lat, longitude: lng, radius }
    });
  },
  getBuffetInMall: async (lat: number, lng: number, radius: number = 2000): Promise<RestaurantDto[]> => {
    return await apiClient.get<RestaurantDto[], RestaurantDto[]>('/restaurants/buffet-mall', {
      params: { latitude: lat, longitude: lng, radius }
    });
  },
  getRandomNearby: async (lat: number, lng: number, radius: number = 2000): Promise<RestaurantDto> => {
    const data = await apiClient.get<RestaurantDto[], RestaurantDto[]>('/restaurants/nearby', {
      params: { latitude: lat, longitude: lng, radius }
    });
    if (!data || data.length === 0) throw new Error("No nearby restaurants found");
    return data[Math.floor(Math.random() * data.length)];
  },
};
