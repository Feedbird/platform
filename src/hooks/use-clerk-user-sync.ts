import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserStore, useWorkspaceStore } from '@/lib/store';
import { userApi } from '@/lib/api/api-service';

export function useClerkUserSync() {
  const { user, isLoaded } = useUser();
  const { setUser, clearUser } = useUserStore();
  const { loadUserWorkspaces } = useWorkspaceStore();
  const didSyncRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const userEmail = user.emailAddresses[0]?.emailAddress || '';
      const userId = user.id;

      // Skip if we've already synced for this user in this session
      if (didSyncRef.current && lastUserIdRef.current === userId) return;
      
      setUser({
        id: userId,
        email: userEmail,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
      });

      // Then fetch complete user data from database (including unread_msg)
      if (userEmail) {
        userApi.getUser({ email: userEmail })
          .then((dbUser) => {
            if (dbUser) {
              
              // Update user with complete database data
              setUser({
                id: dbUser.id,
                email: dbUser.email,
                firstName: dbUser.firstName || undefined,
                lastName: dbUser.lastName || undefined,
                imageUrl: dbUser.imageUrl || undefined,
                unreadMsg: dbUser.unreadMsg || [],
                unreadNotification: dbUser.unreadNotification || [],
                notificationSettings: dbUser.notificationSettings || undefined,
                defaultBoardRules: dbUser.defaultBoardRules || undefined,
                createdAt: new Date(dbUser.createdAt),
                updatedAt: new Date(dbUser.updatedAt),
              });
            }
          })
          .catch((error) => {
            console.error('Failed to fetch user data from database:', error);
          });

        // Load user's workspaces only if not initialized yet
        if (!useWorkspaceStore.getState().workspacesInitialized) {
          loadUserWorkspaces(userEmail).catch((error: any) => {
            console.error('Failed to load user workspaces:', error);
          });
        }
        didSyncRef.current = true;
        lastUserIdRef.current = userId;
      }
    } else {
      didSyncRef.current = false;
      lastUserIdRef.current = null;
      clearUser();
    }
  }, [user, isLoaded, setUser, clearUser, loadUserWorkspaces]);
} 