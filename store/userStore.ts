import { create } from 'zustand';
import { UserProfile } from '@/types';

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: (partial) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...partial } : null,
    })),
  clearProfile: () => set({ profile: null }),
}));
