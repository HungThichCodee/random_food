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
};
