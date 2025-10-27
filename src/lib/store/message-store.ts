import { createPersistedStore } from './store-utils';
import { storeApi } from '@/lib/api/api-service';
import type { MessageChannel } from './types';

export interface MessageStore {
  // State
  channelMessagesByChannelId: Record<string, Array<{ 
    id: string; 
    author: string; 
    text: string; 
    createdAt: Date; 
    authorImageUrl?: string; 
    authorEmail?: string; 
    parentId?: string | null; 
    addon?: any; 
    readby?: any; 
    emoticons?: any; 
    channelId?: string 
  }>>;
  currentChannelId?: string;

  // Channel methods
  addChannel: (name: string, description?: string, icon?: string, members?: string[], color?: string) => Promise<string>;
  updateChannel: (id: string, data: Partial<MessageChannel>) => Promise<void>;
  removeChannel: (id: string) => Promise<void>;
  setCurrentChannelId: (channelId: string | undefined) => void;

  // Message methods
  loadChannelMessages: (channelId: string) => Promise<void>;
  loadAllWorkspaceMessages: () => Promise<void>;
  sendChannelMessage: (channelId: string, content: string, parentId?: string, addon?: any) => Promise<string>;

  // Unread message management
  addUnreadMessage: (messageId: string) => void;
  removeUnreadMessage: (messageId: string) => void;
  hasUnreadMessages: () => boolean;
  markChannelAsRead: (channelId: string) => Promise<void>;
}

export const useMessageStore = createPersistedStore<MessageStore>(
  "message-store",
  (set, get) => ({
    // State
    channelMessagesByChannelId: {},
    currentChannelId: undefined,

    // Channel methods
    addChannel: async (name: string, description?: string, icon?: string, members?: string[], color?: string) => {
      try {
        // Access workspace and user stores
        const { useWorkspaceStore } = require('./workspace-store');
        const { useUserStore } = require('./user-store');
        
        const workspaceStore = useWorkspaceStore.getState();
        const userStore = useUserStore.getState();
        
        const activeWorkspaceId = workspaceStore.activeWorkspaceId;
        const email: string | undefined = userStore.user?.email;
        
        if (!activeWorkspaceId) throw new Error('No active workspace')
        if (!email) throw new Error('No user email')
        
        // Apply defaults similar to addBoard
        const finalIcon = icon && icon.trim() ? icon.trim() : '/images/boards/icons/icon-2.svg'
        const finalColor = color === '#FFFFFF' ? '#125AFF' : color
        const cid = await storeApi.createChannelAndUpdateStore(
          activeWorkspaceId,
          email,
          name,
          description,
          members,
          finalIcon,
          finalColor
        )
        return cid
      } catch (error) {
        console.error('Failed to add channel:', error)
        throw error
      }
    },

    updateChannel: async (id: string, data: Partial<MessageChannel>) => {
      try {
        await storeApi.updateChannelAndUpdateStore(id, data)
      } catch (error) {
        console.error('Failed to update channel:', error)
        throw error
      }
    },

    removeChannel: async (id: string) => {
      try {
        await storeApi.deleteChannelAndUpdateStore(id)
      } catch (error) {
        console.error('Failed to remove channel:', error)
        throw error
      }
    },

    setCurrentChannelId: (channelId) => set({ currentChannelId: channelId }),

    // Message methods
    loadChannelMessages: async (channelId: string) => {
      try {
        await (storeApi as any).fetchChannelMessagesAndUpdateStore(channelId)
      } catch (error) {
        console.error('Failed to load channel messages:', error)
        throw error
      }
    },

    loadAllWorkspaceMessages: async () => {
      try {
        await (storeApi as any).fetchAllWorkspaceMessagesAndUpdateStore()
      } catch (error) {
        console.error('Failed to load all workspace messages:', error)
        throw error
      }
    },

    sendChannelMessage: async (channelId: string, content: string, parentId?: string, addon?: any) => {
      try {
        // Access workspace and user stores
        const { useWorkspaceStore } = require('./workspace-store');
        const { useUserStore } = require('./user-store');
        
        const workspaceStore = useWorkspaceStore.getState();
        const userStore = useUserStore.getState();
        
        const activeWorkspaceId = workspaceStore.activeWorkspaceId;
        const userEmail: string | undefined = userStore.user?.email;
        
        if (!activeWorkspaceId) throw new Error('No active workspace')
        if (!userEmail) throw new Error('No user email')
        
        const id = await (storeApi as any).createChannelMessageAndUpdateStore(activeWorkspaceId, channelId, content, userEmail, parentId, addon)
        return id
      } catch (error) {
        console.error('Failed to send channel message:', error)
        // If it's an API error with validation details, log them
        if (error && typeof error === 'object' && 'message' in error) {
          const apiError = error as any;
          if (apiError.message === 'Validation error' && apiError.details) {
            console.error('Validation error details:', apiError.details);
          }
        }
        throw error
      }
    },

    // Unread message management
    addUnreadMessage: (messageId: string) => {
      set((s: MessageStore) => {
        // Access user store to get user data
        const { useUserStore } = require('./user-store'); // Dynamic import to avoid circular dependency
        const userStore = useUserStore.getState();
        const user = userStore.user;
        
        if (!user) return s;
        
        // Check if message is already in unread list
        const currentUnread = user.unreadMsg || []
        if (currentUnread.includes(messageId)) return s;
        
        // Update user store with new unread message
        userStore.updateUserNotificationSettings({
          ...user.notificationSettings,
          unreadMsg: [...currentUnread, messageId]
        });
        
        return s;
      });
    },

    removeUnreadMessage: (messageId: string) => {
      set((s: MessageStore) => {
        // Access user store to get user data
        const { useUserStore } = require('./user-store'); // Dynamic import to avoid circular dependency
        const userStore = useUserStore.getState();
        const user = userStore.user;
        
        if (!user) return s;
        
        const currentUnread = user.unreadMsg || []
        const newUnread = currentUnread.filter((id: string) => id !== messageId)
        
        // Update user store with filtered unread messages
        userStore.updateUserNotificationSettings({
          ...user.notificationSettings,
          unreadMsg: newUnread
        });
        
        return s;
      });
    },

    hasUnreadMessages: () => {
      // Access user store to get user data
      const { useUserStore } = require('./index'); // Dynamic import to avoid circular dependency
      const userStore = useUserStore.getState();
      const user = userStore.user;
      
      const hasUnread = (user?.unreadMsg?.length || 0) > 0;
      return hasUnread;
    },

    // Mark all messages in a channel as read
    markChannelAsRead: async (channelId: string) => {
      try {
        // Access user store to get user data
        const { useUserStore } = require('./user-store'); // Dynamic import to avoid circular dependency
        const userStore = useUserStore.getState();
        const user = userStore.user;
        const currentUserEmail = user?.email;
        
        if (!currentUserEmail) return

        const result = await (storeApi as any).markChannelAsRead(currentUserEmail, channelId)
        if (result?.unreadMsg) {
          // Update user store with new unread messages
          userStore.updateUserNotificationSettings({
            ...user.notificationSettings,
            unreadMsg: result.unreadMsg
          });
        }
      } catch (error) {
        console.error('Error marking channel as read:', error)
      }
    },
  })
);
