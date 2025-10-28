import { createPersistedStore } from './store-utils';
import type { User, NotificationSettings } from './types';

export interface UserStore {
  // State
  user: User | null;

  // User management methods
  setUser: (user: User | null) => void;
  updateUserNotificationSettings: (notificationSettings: NotificationSettings) => void;
  clearUser: () => void;

  // Unread message management
  addUnreadMessage: (messageId: string) => void;
  removeUnreadMessage: (messageId: string) => void;
  hasUnreadMessages: () => boolean;
}

export const useUserStore = createPersistedStore<UserStore>(
  "user-store",
  (set, get) => ({
    // State
    user: null,

    // User management methods
    setUser: (user: User | null) => {
      set({ user })
      // User is now set, unread messages will be handled through websocket events
    },

    updateUserNotificationSettings: (notificationSettings: NotificationSettings) => {
      set((state) => ({
        user: state.user ? {
          ...state.user,
          notificationSettings: notificationSettings
        } : null
      }))
    },

    clearUser: () => set({ user: null }),

    // Unread message management
    addUnreadMessage: (messageId: string) => {
      set((s) => {
        if (!s.user) return s;
        
        // Check if message is already in unread list
        const currentUnread = s.user.unreadMsg || []
        if (currentUnread.includes(messageId)) return s;
        
        return {
          ...s,
          user: {
            ...s.user,
            unreadMsg: [...currentUnread, messageId]
          }
        };
      });
    },

    removeUnreadMessage: (messageId: string) => {
      set((s) => {
        if (!s.user) return s;
        
        const currentUnread = s.user.unreadMsg || []
        const newUnread = currentUnread.filter(id => id !== messageId)
        
        return {
          ...s,
          user: {
            ...s.user,
            unreadMsg: newUnread
          }
        };
      });
    },

    hasUnreadMessages: () => {
      const hasUnread = (get().user?.unreadMsg?.length || 0) > 0;
      return hasUnread;
    },
  })
);
