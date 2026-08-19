import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccessibilityProfile } from './scoring';

interface ProfileState {
  profile: AccessibilityProfile | null;
  setProfile: (profile: AccessibilityProfile | null) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
    }),
    {
      name: 'accessibility-profile-storage',
    }
  )
);
