import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store';

export function useClerkUserSync() {
  const { user, isLoaded } = useUser();
  const { setUser, clearUser, loadUserWorkspaces } = useFeedbirdStore();

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const userEmail = user.emailAddresses[0]?.emailAddress || '';
      
      setUser({
        id: user.id,
        email: userEmail,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined,
        createdAt: user.createdAt || new Date(),
      });

      // Load user's workspaces
      if (userEmail) {
        loadUserWorkspaces(userEmail).catch(error => {
          console.error('Failed to load user workspaces:', error);
        });
      }
    } else {
      clearUser();
    }
  }, [user, isLoaded, setUser, clearUser, loadUserWorkspaces]);
} 