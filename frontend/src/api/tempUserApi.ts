import apiClient from './axiosClient';
import type { CreateTempUserDto, TempUserDto } from '../types/tempUser';

export const tempUserApi = {
  create: async (dto: CreateTempUserDto): Promise<TempUserDto> => {
    const response = await apiClient.post<TempUserDto>('/tempusers', dto);
    return response.data;
  },
  getMe: async (sessionToken: string): Promise<TempUserDto> => {
    const response = await apiClient.get<TempUserDto>('/tempusers/me', {
      headers: {
        'X-Session-Token': sessionToken,
      },
    });
    return response.data;
  },
  updateLocation: async (userId: string, lat: number, lng: number): Promise<void> => {
    await apiClient.put(`/tempusers/${userId}/location`, { lat, lng });
  },
  getNearby: async (lat: number, lng: number, radius?: number): Promise<TempUserDto[]> => {
    const response = await apiClient.get<TempUserDto[]>('/tempusers/nearby', {
      params: { lat, lng, radiusKm: radius },
    });
    return response.data;
  },
  setVisibility: async (userId: string, visible: boolean): Promise<void> => {
    await apiClient.put(`/tempusers/${userId}/visibility`, visible, {
      headers: { 'Content-Type': 'application/json' }
    });
  },
};
