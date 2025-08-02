import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store';

export function useClerkUserSync() {
  const { user, isLoaded } = useUser();
  const { setUser, clearUser } = useFeedbirdStore();

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      setUser({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined,
        createdAt: user.createdAt,
      });
    } else {
      clearUser();
    }
  }, [user, isLoaded, setUser, clearUser]);
} 