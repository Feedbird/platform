"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as React from "react";
import { v4 as uuidv4 } from 'uuid';

// Import domain stores
import { useWorkspaceStore } from './workspace-store';
import { usePostStore } from './post-store';
import { useMessageStore } from './message-store';
import { useSocialStore } from './social-store';
import { useUserStore } from './user-store';
import { useFormStore } from './forms-store';

// Import utilities
import { useStoreWithHydration, determineCorrectStatus } from './store-utils';
import { storeApi } from '@/lib/api/api-service';

// Import types
import type { 
  Platform, 
  Status, 
  FileKind, 
  ContentFormat,
  SocialAccount, 
  SocialPage,
  PostHistory,
  PostSettings,
  NavLink,
  Post,
  Workspace,
  Brand,
  Board,
  BoardTemplate,
  MessageChannel,
  User,
  NotificationSettings,
  ConditionGroup,
  BoardRules,
  GroupComment,
  GroupMessage,
  Activity,
  Block,
  Version,
  BaseComment,
  VersionComment
} from './types';

// Default platform navigation
const defaultPlatformNav: NavLink[] = [
  {
    id: "messages",
    label: "Messages",
    image: "/images/sidebar/messages-on.svg",
    selectedImage: "/images/sidebar/messages-on-active.svg",
    href: "/messages",
  },
  {
    id: "notifications",
    label: "Notifications",
    image: "/images/sidebar/notifications-on.svg",
    selectedImage: "/images/sidebar/notifications-on-active.svg",
    href: "/notifications",
  },
  {
    id: "approvals",
    label: "Approvals",
    image: "/images/sidebar/approvals.svg",
    selectedImage: "/images/sidebar/approvals-active.svg",
    href: "/approvals",
  },
  {
    id: "analytics",
    label: "Analytics",
    image: "/images/sidebar/analytics.svg",
    selectedImage: "/images/sidebar/analytics-active.svg",
    href: "/analytics",
  },
];

// Main composed store interface - this provides a unified interface
export interface FeedbirdStore {
  // Navigation
  platformNav: NavLink[];

  // Composed methods that coordinate between domain stores
  getActiveWorkspace: () => Workspace | undefined;
  getActiveBrand: () => Brand | undefined;
  getActivePosts: () => Post[];
  getAllPosts: () => Post[];
  getPost: (id: string) => Post | undefined;
  
  // Cross-domain methods
  updatePostStatusesBasedOnTime: () => void;
}

// Create the main composed store
export const useFeedbirdStore = create<FeedbirdStore>()(
  persist(
    (set, get) => ({
      // Navigation
      platformNav: defaultPlatformNav,

      // Composed methods that coordinate between domain stores
      getActiveWorkspace: () => {
        const workspaceStore = useWorkspaceStore.getState();
        return workspaceStore.getActiveWorkspace();
      },

      getActiveBrand: () => {
        const workspaceStore = useWorkspaceStore.getState();
        return workspaceStore.getActiveBrand();
      },

      getActivePosts: () => {
        const workspaceStore = useWorkspaceStore.getState();
        const workspace = workspaceStore.getActiveWorkspace();
        const boardId = workspaceStore.activeBoardId;
        if (!workspace || !boardId) return [];
        
        const board = workspace.boards.find(b => b.id === boardId);
        return board?.posts ?? [];
      },

      getAllPosts: () => {
        const workspaceStore = useWorkspaceStore.getState();
        const workspace = workspaceStore.getActiveWorkspace();
        if (!workspace) return [];
        
        return workspace.boards.flatMap(board => board.posts);
      },

      getPost: (id: string) => {
        const workspaceStore = useWorkspaceStore.getState();
        const workspace = workspaceStore.getActiveWorkspace();
        if (workspace) {
          for (const board of workspace.boards) {
            const found = board.posts.find((p) => p.id === id);
            if (found) return found;
          }
        }
        return undefined;
      },

      // Cross-domain methods
      updatePostStatusesBasedOnTime: () => {
        const workspaceStore = useWorkspaceStore.getState();
        const workspaces = workspaceStore.workspaces;
        
        let updatedCount = 0;
        let hasChanges = false;
        
        const newWs = workspaces.map((ws) => ({
          ...ws,
          boards: ws.boards.map((board) => {
            const updatedPosts = board.posts.map((p) => {
              const correctStatus = determineCorrectStatus(p.status, p.publishDate);
              if (correctStatus !== p.status) {
                updatedCount++;
                hasChanges = true;
                return { ...p, status: correctStatus };
              }
              return p;
            });
            
            // Only create new board object if posts changed
            if (hasChanges) {
              return { ...board, posts: updatedPosts };
            }
            return board;
          }),
        }));
        
        if (updatedCount > 0) {
          // Update workspace store with new workspaces
          useWorkspaceStore.setState({ workspaces: newWs });
        }
      },
    }),
    {
      name: "feedbird-v5",
      storage: createJSONStorage(() => {
        // Check if we're on the client side
        if (typeof window === 'undefined') {
          // Server-side: return a mock storage
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        // Client-side: use sessionStorage
        return sessionStorage;
      }),
      skipHydration: true,
    }
  )
);

// Export domain stores for direct access when needed
export { 
  useWorkspaceStore, 
  usePostStore, 
  useMessageStore, 
  useSocialStore, 
  useUserStore, 
  useFormStore 
};

// Export utilities
export { useStoreWithHydration, determineCorrectStatus } from './store-utils';

// Export types
export * from './types';

// Custom hook to handle hydration
export const useHydration = () => {
  const [hydrated, setHydrated] = React.useState(false);
  
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  
  return hydrated;
};

// Hook to use the main store with proper hydration handling
export const useFeedbirdStoreWithHydration = <T>(selector: (state: FeedbirdStore) => T): T | undefined => {
  const hydrated = useHydration();
  const result = useFeedbirdStore(selector);
  
  if (!hydrated) {
    return undefined;
  }
  
  return result;
};

// Hook to periodically update post statuses based on time
export const usePostStatusTimeUpdater = () => {
  const updatePostStatusesBasedOnTime = useFeedbirdStore(s => s.updatePostStatusesBasedOnTime);
  const workspaces = useWorkspaceStore(s => s.workspaces);
  
  // Helper function to check if any posts need status updates
  const checkIfUpdatesNeeded = React.useCallback(() => {
    const now = new Date();
    for (const ws of workspaces) {
      for (const board of ws.boards) {
        for (const post of board.posts) {
          if (post.publishDate) {
            const publishDate = post.publishDate instanceof Date ? post.publishDate : new Date(post.publishDate);
            if (!isNaN(publishDate.getTime())) {
              const isPast = publishDate < now;
              const needsUpdate = (isPast && post.status !== "Published" && post.status !== "Failed Publishing") ||
                                (!isPast && (post.status === "Published" || post.status === "Failed Publishing"));
              if (needsUpdate) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }, [workspaces]);
  
  React.useEffect(() => {
    // Update immediately on mount
    updatePostStatusesBasedOnTime();
    
    // Set up interval to check every 60 seconds (increased from 10 seconds for production)
    const interval = setInterval(() => {
      // Only run the update if there are posts that might need status changes
      if (checkIfUpdatesNeeded()) {
        updatePostStatusesBasedOnTime();
      } else {
        console.log("PostStatusTimeUpdater: No status updates needed, skipping...");
      }
    }, 60000); // 60 seconds for production
    
    return () => {
      clearInterval(interval);
    };
  }, [updatePostStatusesBasedOnTime, checkIfUpdatesNeeded]);
};
