import apiClient from './axiosClient';
import type { MatchRequestDto, CreateMatchRequestDto, MeetingSuggestionsDto, MeetingSearchKind } from '../types/match';

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
  getById: async (requestId: number): Promise<MatchRequestDto> => {
    return await apiClient.get<MatchRequestDto, MatchRequestDto>(`/MatchRequests/${requestId}`);
  },
  getMeetingSuggestions: async (requestId: number,
    kind: MeetingSearchKind = 'restaurant'): Promise<MeetingSuggestionsDto> => {
    return await apiClient.get<MeetingSuggestionsDto, MeetingSuggestionsDto>(
      `/MatchRequests/${requestId}/meeting-suggestions?kind=${kind}`);
  },
  proposeMeetingPlace: async (requestId: number, placeId: string): Promise<MatchRequestDto> => {
    return await apiClient.post<MatchRequestDto, MatchRequestDto>(
      `/MatchRequests/${requestId}/meeting-place`, { placeId });
  },
  proposeGoogleMeetingPlace: async (requestId: number, name: string,
    googleMapsUrl: string): Promise<MatchRequestDto> => {
    return await apiClient.post<MatchRequestDto, MatchRequestDto>(
      `/MatchRequests/${requestId}/meeting-place/google`, { name, googleMapsUrl });
  },
  confirmMeetingPlace: async (requestId: number, placeId: string): Promise<MatchRequestDto> => {
    return await apiClient.post<MatchRequestDto, MatchRequestDto>(
      `/MatchRequests/${requestId}/meeting-place/confirm`, { placeId });
  },
  shareLocation: async (requestId: number): Promise<MatchRequestDto> => {
    return await apiClient.post<MatchRequestDto, MatchRequestDto>(`/MatchRequests/${requestId}/share-location`, {});
  },
  stopSharingLocation: async (requestId: number): Promise<MatchRequestDto> => {
    return await apiClient.post<MatchRequestDto, MatchRequestDto>(`/MatchRequests/${requestId}/stop-sharing-location`, {});
  },
};
