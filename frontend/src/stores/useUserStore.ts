import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TempUserDto } from '../types/tempUser';

// Move an existing temporary session to tab storage without carrying over GPS coordinates.
const userStorageKey = 'foodmatch-user-storage';
try {
  const oldValue = localStorage.getItem(userStorageKey);
  if (oldValue && !sessionStorage.getItem(userStorageKey)) {
    const previous = JSON.parse(oldValue);
    const profile = previous?.state?.profile;
    if (profile && typeof profile.id === 'string' && typeof profile.token === 'string') {
      sessionStorage.setItem(userStorageKey, JSON.stringify({
        state: {
          profile: { ...profile, currentLat: null, currentLng: null },
          currentUser: null,
          nearbyUsers: [],
          isLocationEnabled: false,
        },
        version: previous.version ?? 0,
      }));
    }
  }
  localStorage.removeItem(userStorageKey);
} catch {
  try { localStorage.removeItem(userStorageKey); } catch { /* Storage may be unavailable. */ }
}

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
      name: userStorageKey,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        ...state,
        profile: state.profile ? { ...state.profile, currentLat: null, currentLng: null } : null,
        currentUser: null,
        nearbyUsers: [],
      }),
    }
  )
);
