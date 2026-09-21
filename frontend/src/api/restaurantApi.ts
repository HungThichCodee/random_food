import apiClient from './axiosClient';
import type { RestaurantDto } from '../types/restaurant';

// TODO: Implement API calls
export const restaurantApi = {
  getNearby: async (lat: number, lng: number, radius?: number): Promise<RestaurantDto[]> => {
    throw new Error('Not implemented');
  },
  getBuffetInMall: async (lat: number, lng: number): Promise<RestaurantDto[]> => {
    throw new Error('Not implemented');
  },
  getRandomNearby: async (lat: number, lng: number, radius?: number): Promise<RestaurantDto> => {
    throw new Error('Not implemented');
  },
};
