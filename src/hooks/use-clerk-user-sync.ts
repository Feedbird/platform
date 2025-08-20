import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store';
import { getUserFromDatabase } from '@/lib/supabase/user-sync';

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

      // Then fetch complete user data from database (including unread_msg)
      if (userEmail) {
        getUserFromDatabase(userEmail)
          .then((dbUser) => {
            if (dbUser) {
              
              // Update user with complete database data
              setUser({
                id: dbUser.id,
                email: dbUser.email,
                firstName: dbUser.first_name || undefined,
                lastName: dbUser.last_name || undefined,
                imageUrl: dbUser.image_url || undefined,
                unreadMsg: dbUser.unread_msg || [],
                createdAt: new Date(dbUser.created_at),
              });
            }
          })
          .catch((error) => {
            console.error('Failed to fetch user data from database:', error);
          });

        // Load user's workspaces
        loadUserWorkspaces(userEmail).catch(error => {
          console.error('Failed to load user workspaces:', error);
        });
      }
    } else {
      clearUser();
    }
  }, [user, isLoaded, setUser, clearUser, loadUserWorkspaces]);
} 