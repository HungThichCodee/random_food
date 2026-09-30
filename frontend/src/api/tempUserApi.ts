import apiClient from './axiosClient';
import type { CreateTempUserDto, TempUserDto } from '../types/tempUser';

export const tempUserApi = {
  create: async (dto: CreateTempUserDto): Promise<TempUserDto> => {
    return await apiClient.post<TempUserDto, TempUserDto>('/tempusers', dto);
  },
  getMe: async (sessionToken: string): Promise<TempUserDto> => {
    return await apiClient.get<TempUserDto, TempUserDto>('/tempusers/me', {
      headers: {
        'X-Session-Token': sessionToken,
      },
    });
  },
  updateLocation: async (userId: string, lat: number, lng: number): Promise<void> => {
    await apiClient.put(`/tempusers/${userId}/location`, { lat, lng });
  },
  getNearby: async (lat: number, lng: number, radius?: number): Promise<TempUserDto[]> => {
    return await apiClient.get<TempUserDto[], TempUserDto[]>('/tempusers/nearby', {
      params: { lat, lng, radiusKm: radius },
    });
  },
  setVisibility: async (userId: string, visible: boolean): Promise<void> => {
    await apiClient.put(`/tempusers/${userId}/visibility`, visible, {
      headers: { 'Content-Type': 'application/json' }
    });
  },
};
