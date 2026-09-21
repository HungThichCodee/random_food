import apiClient from './axiosClient';
import type { CreateTempUserDto, TempUserDto } from '../types/tempUser';

// TODO: Implement API calls
export const tempUserApi = {
  create: async (dto: CreateTempUserDto): Promise<TempUserDto> => {
    throw new Error('Not implemented');
  },
  updateLocation: async (userId: string, lat: number, lng: number): Promise<void> => {
    throw new Error('Not implemented');
  },
  getNearby: async (lat: number, lng: number, radius?: number): Promise<TempUserDto[]> => {
    throw new Error('Not implemented');
  },
  setVisibility: async (userId: string, visible: boolean): Promise<void> => {
    throw new Error('Not implemented');
  },
};
