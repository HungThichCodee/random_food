import apiClient from './axiosClient';
import type { CreateTempUserDto, TempUserDto, NearbyUserDto } from '../types/tempUser';

export const tempUserApi = {
  create: async (dto: CreateTempUserDto): Promise<TempUserDto> => {
    return await apiClient.post<TempUserDto, TempUserDto>('/tempusers', dto);
  },
  updateLocation: async (userId: string, lat: number, lng: number): Promise<void> => {
    await apiClient.put(`/tempusers/${userId}/location`, { lat, lng });
  },
  getNearby: async (): Promise<NearbyUserDto[]> => {
    return await apiClient.get<NearbyUserDto[], NearbyUserDto[]>('/tempusers/nearby');
  },
  setVisibility: async (userId: string, visible: boolean): Promise<void> => {
    await apiClient.put(`/tempusers/${userId}/visibility`, visible, {
      headers: { 'Content-Type': 'application/json' }
    });
  },
};
