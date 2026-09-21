import { create } from 'zustand';
import type { MatchRequestDto } from '../types/match';
import type { ChatMessageDto } from '../types/chat';

interface MatchState {
  activeMatch: MatchRequestDto | null;
  pendingRequests: MatchRequestDto[];
  chatMessages: ChatMessageDto[];
  isChatOpen: boolean;
  // TODO: Add actions
  setActiveMatch: (match: MatchRequestDto | null) => void;
  setPendingRequests: (requests: MatchRequestDto[]) => void;
  addChatMessage: (message: ChatMessageDto) => void;
  setChatMessages: (messages: ChatMessageDto[]) => void;
  setChatOpen: (open: boolean) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  activeMatch: null,
  pendingRequests: [],
  chatMessages: [],
  isChatOpen: false,
  setActiveMatch: (match) => set({ activeMatch: match }),
  setPendingRequests: (requests) => set({ pendingRequests: requests }),
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  setChatOpen: (open) => set({ isChatOpen: open }),
}));
