import apiClient from './axiosClient';
import type { ChatMessageDto } from '../types/chat';

// TODO: Implement API calls
export const chatApi = {
  getMessages: async (matchRequestId: number): Promise<ChatMessageDto[]> => {
    throw new Error('Not implemented');
  },
};
