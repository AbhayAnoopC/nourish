import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/types';

interface UserState {
  profile: UserProfile | null;
  draft: Partial<UserProfile>;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  updateDraft: (partial: Partial<UserProfile>) => void;
  finishOnboarding: () => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      draft: {},

      setProfile: (profile) => set({ profile }),

      updateProfile: (partial) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...partial } : null,
        })),

      updateDraft: (partial) =>
        set((state) => ({ draft: { ...state.draft, ...partial } })),

      finishOnboarding: () => {
        const draft = get().draft;
        const profile: UserProfile = {
          name: draft.name,
          sex: draft.sex ?? 'other',
          dateOfBirth: draft.dateOfBirth ?? '1990-01-01',
          heightCm: draft.heightCm ?? 170,
          weightKg: draft.weightKg ?? 70,
          activityLevel: draft.activityLevel ?? 'sedentary',
          goal: draft.goal ?? 'maintain',
          dailyCalorieTarget: draft.dailyCalorieTarget ?? 2000,
          dailyProteinTarget: draft.dailyProteinTarget ?? 125,
          dailyCarbTarget: draft.dailyCarbTarget ?? 225,
          dailyFatTarget: draft.dailyFatTarget ?? 67,
          dailyWaterTargetMl: 2000,
          units: draft.units ?? 'metric',
          onboardingComplete: true,
        };
        set({ profile, draft: {} });
      },

      clearProfile: () => set({ profile: null, draft: {} }),
    }),
    {
      name: 'nourish-user',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
