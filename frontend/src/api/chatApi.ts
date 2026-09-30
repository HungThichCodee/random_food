import apiClient from './axiosClient';
import type { ChatMessageDto } from '../types/chat';

export const chatApi = {
  getMessages: async (matchRequestId: number): Promise<ChatMessageDto[]> => {
    const res = await apiClient.get<ChatMessageDto[]>(`/Chat/${matchRequestId}/messages`);
    return res.data;
  },
  sendMessage: async (matchRequestId: number, message: string): Promise<ChatMessageDto> => {
    const res = await apiClient.post<ChatMessageDto>('/Chat', { matchRequestId, message });
    return res.data;
  }
};
