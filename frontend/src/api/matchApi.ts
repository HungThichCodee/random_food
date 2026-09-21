import apiClient from './axiosClient';
import type { MatchRequestDto, CreateMatchRequestDto } from '../types/match';

// TODO: Implement API calls
export const matchApi = {
  sendRequest: async (dto: CreateMatchRequestDto): Promise<MatchRequestDto> => {
    throw new Error('Not implemented');
  },
  respond: async (requestId: number, accept: boolean): Promise<MatchRequestDto> => {
    throw new Error('Not implemented');
  },
  getPending: async (): Promise<MatchRequestDto[]> => {
    throw new Error('Not implemented');
  },
};
