import { useUserStore } from '@/lib/store';

/**
 * Gets the current user's display name (first name or fallback)
 * @returns The user's first name or "You" as fallback
 */
export function getCurrentUserDisplayName(): string {
  const store = useUserStore.getState();
  const user = store.user;
  
  if (user?.firstName) {
    return user.firstName;
  }
  
  // Fallback to "You" if no first name is available
  return "You";
}

/**
 * Gets the current user's display name from a store instance
 * @param store The store instance
 * @returns The user's first name or "You" as fallback
 */
export function getCurrentUserDisplayNameFromStore(): string {
  const store = useUserStore.getState();
  const user = store.user;
  
  if (user?.firstName) {
    return user.firstName;
  }
  
  // Fallback to "You" if no first name is available
  return "You";
} 