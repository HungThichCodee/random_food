import { create } from 'zustand';
import type { TempUserDto } from '../types/tempUser';

interface UserState {
  currentUser: TempUserDto | null;
  nearbyUsers: TempUserDto[];
  isLocationEnabled: boolean;
  // TODO: Add actions
  setCurrentUser: (user: TempUserDto | null) => void;
  setNearbyUsers: (users: TempUserDto[]) => void;
  setLocationEnabled: (enabled: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  nearbyUsers: [],
  isLocationEnabled: false,
  setCurrentUser: (user) => set({ currentUser: user }),
  setNearbyUsers: (users) => set({ nearbyUsers: users }),
  setLocationEnabled: (enabled) => set({ isLocationEnabled: enabled }),
}));
