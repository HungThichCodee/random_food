import apiClient from './axiosClient';
import type { RouteDto } from '../types/route';

export const routeApi = {
  getRoute: async (fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<RouteDto> => {
    return await apiClient.get<RouteDto, RouteDto>(`/Routes?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`);
  },
};
