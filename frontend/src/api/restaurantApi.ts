import apiClient from './axiosClient';
import type { RestaurantDto } from '../types/restaurant';

// TODO: Implement API calls
export const restaurantApi = {
  getNearby: async (lat: number, lng: number, radius: number = 2000): Promise<RestaurantDto[]> => {
    const response = await apiClient.get<RestaurantDto[]>('/restaurants/nearby', {
      params: { latitude: lat, longitude: lng, radius }
    });
    return response.data;
  },
  getBuffetInMall: async (lat: number, lng: number, radius: number = 2000): Promise<RestaurantDto[]> => {
    const response = await apiClient.get<RestaurantDto[]>('/restaurants/buffet-mall', {
      params: { latitude: lat, longitude: lng, radius }
    });
    return response.data;
  },
  getRandomNearby: async (lat: number, lng: number, radius: number = 2000): Promise<RestaurantDto> => {
    const response = await apiClient.get<RestaurantDto[]>('/restaurants/nearby', {
      params: { latitude: lat, longitude: lng, radius }
    });
    const data = response.data;
    if (!data || data.length === 0) throw new Error("No nearby restaurants found");
    return data[Math.floor(Math.random() * data.length)];
  },
};
