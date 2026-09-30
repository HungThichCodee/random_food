import apiClient from './axiosClient';
import type { MatchRequestDto, CreateMatchRequestDto } from '../types/match';

export const matchApi = {
  sendRequest: async (dto: CreateMatchRequestDto): Promise<MatchRequestDto> => {
    const res = await apiClient.post<MatchRequestDto>('/MatchRequests', dto);
    return res.data;
  },
  respond: async (requestId: number, accept: boolean): Promise<MatchRequestDto> => {
    const res = await apiClient.put<MatchRequestDto>(`/MatchRequests/${requestId}/respond`, { accept });
    return res.data;
  },
  getPending: async (): Promise<MatchRequestDto[]> => {
    const res = await apiClient.get<MatchRequestDto[]>('/MatchRequests/pending');
    return res.data;
  },
};
