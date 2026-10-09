import apiClient from './axiosClient';
import type { ChatMessageDto } from '../types/chat';

export const chatApi = {
  getMessages: async (matchRequestId: number): Promise<ChatMessageDto[]> => {
    // axiosClient interceptor already unwraps response.data
    return await apiClient.get<ChatMessageDto[], ChatMessageDto[]>(`/Chat/${matchRequestId}/messages`);
  },
  sendMessage: async (matchRequestId: number, message: string): Promise<ChatMessageDto> => {
    // axiosClient interceptor already unwraps response.data
    return await apiClient.post<ChatMessageDto, ChatMessageDto>('/Chat', { matchRequestId, message });
  }
};
