import { useProfileStore } from '../store';

export function useProfile() {
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  
  return { profile, setProfile };
}
