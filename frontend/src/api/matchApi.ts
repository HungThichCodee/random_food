import apiClient from './axiosClient';
import type { MatchRequestDto, CreateMatchRequestDto } from '../types/match';

export const matchApi = {
  sendRequest: async (dto: CreateMatchRequestDto): Promise<MatchRequestDto> => {
    return await apiClient.post<MatchRequestDto, MatchRequestDto>('/MatchRequests', dto);
  },
  respond: async (requestId: number, accept: boolean): Promise<MatchRequestDto> => {
    return await apiClient.put<MatchRequestDto, MatchRequestDto>(`/MatchRequests/${requestId}/respond`, { accept });
  },
  getPending: async (): Promise<MatchRequestDto[]> => {
    return await apiClient.get<MatchRequestDto[], MatchRequestDto[]>('/MatchRequests/pending');
  },
  getActive: async (): Promise<MatchRequestDto> => {
    return await apiClient.get<MatchRequestDto, MatchRequestDto>('/MatchRequests/active');
  },
  shareLocation: async (requestId: number): Promise<MatchRequestDto> => {
    return await apiClient.post<MatchRequestDto, MatchRequestDto>(`/MatchRequests/${requestId}/share-location`, {});
  },
  stopSharingLocation: async (requestId: number): Promise<MatchRequestDto> => {
    return await apiClient.post<MatchRequestDto, MatchRequestDto>(`/MatchRequests/${requestId}/stop-sharing-location`, {});
  },
};
