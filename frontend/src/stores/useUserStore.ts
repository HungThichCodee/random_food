import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TempUserDto } from '../types/tempUser';

interface UserState {
  currentUser: TempUserDto | null;
  profile: TempUserDto | null;
  nearbyUsers: TempUserDto[];
  isLocationEnabled: boolean;
  setCurrentUser: (user: TempUserDto | null) => void;
  setProfile: (user: TempUserDto | null) => void;
  setNearbyUsers: (users: TempUserDto[]) => void;
  setLocationEnabled: (enabled: boolean) => void;
  clearProfile: () => void;
  toggleVisibilityLocally: (visible: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      profile: null,
      nearbyUsers: [],
      isLocationEnabled: false,
      setCurrentUser: (user) => set({ currentUser: user }),
      setProfile: (user) => set({ profile: user, currentUser: user }),
      setNearbyUsers: (users) => set({ nearbyUsers: users }),
      setLocationEnabled: (enabled) => set({ isLocationEnabled: enabled }),
      clearProfile: () => set({ currentUser: null, profile: null, nearbyUsers: [], isLocationEnabled: false }),
      toggleVisibilityLocally: (visible) => 
        set((state) => ({
          profile: state.profile ? { ...state.profile, locationVisible: visible } : null,
          currentUser: state.currentUser ? { ...state.currentUser, locationVisible: visible } : null
        })),
    }),
    {
      name: 'foodmatch-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
