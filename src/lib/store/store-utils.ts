import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as React from "react";
import type { 
  Workspace, 
  Brand, 
  SocialPage, 
  SocialAccount, 
  Status,
  Board,
  NavLink
} from './types';

// Base store configuration
export const createPersistedStore = <T>(
  name: string,
  storeFactory: (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T
) => {
  return create<T>()(
    persist(
      storeFactory,
      {
        name,
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
};

// Custom hook to handle hydration
export const useHydration = () => {
  const [hydrated, setHydrated] = React.useState(false);
  
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  
  return hydrated;
};

// Hook to use any store with proper hydration handling
export const useStoreWithHydration = <T, R>(
  store: (selector: (state: T) => R) => R,
  selector: (state: T) => R
): R | undefined => {
  const hydrated = useHydration();
  const result = store(selector);
  
  if (!hydrated) {
    return undefined;
  }
  
  return result;
};

// Utility function to convert boards to navigation links
export const boardsToNav = (boards: Board[], workspaceId?: string): NavLink[] => {
  return boards.map((b) => ({ 
    id: b.id, 
    label: b.name, 
    image: b.image, 
    selectedImage: b.selectedImage, 
    href: workspaceId ? `/${workspaceId}/content/${b.id}` : `/content/${b.id}`, 
    rules: b.rules,
    color: b.color // Add color to NavLink
  }));
};

// Helper function to determine correct post status based on publish date
export const determineCorrectStatus = (currentStatus: Status, publishDate: Date | null): Status => {
  // If no publish date, keep current status
  if (!publishDate) {
    return currentStatus;
  }

  // Convert to Date object if it's a string (due to JSON serialization)
  const publishDateObj = publishDate instanceof Date ? publishDate : new Date(publishDate);
  
  // Check if the date is valid
  if (isNaN(publishDateObj.getTime())) {
    return currentStatus;
  }

  const now = new Date();
  const isPast = publishDateObj < now;

  if (isPast) {
    // If publish date is in the past, status should be 'Published' or 'Failed Publishing'
    // Only change if current status is not already one of these
    if (currentStatus === "Published" || currentStatus === "Failed Publishing") {
      return currentStatus; // Keep as is
    }
    // For other statuses, change to Published (unless it was Failed Publishing)
    return "Published";
  } else {
    // If publish date is in the future, keep current status
    // Only change if current status is past-related and publish date is in future
    if (currentStatus === "Published" || currentStatus === "Failed Publishing") {
      return "Scheduled";
    }
    return currentStatus;
  }
};

// Helper to coerce any value to PageStatus
export const toPageStatus = (val: string): "active" | "expired" | "pending" | "disconnected" => {
  return ["active", "expired", "pending", "disconnected"].includes(val) ? val as "active" | "expired" | "pending" | "disconnected" : "pending";
};

// Helper functions to avoid deep nesting and complex state updates
export const findBrand = (workspaces: Workspace[], brandId: string): Brand | undefined =>
  workspaces.map(w => w.brand).filter(b => b !== undefined).find(b => b!.id === brandId);

export const findPage = (workspace: Workspace, pageId: string): SocialPage | undefined =>
  workspace?.socialPages?.find((p: SocialPage) => p.id === pageId);

export const findAccount = (workspace: Workspace, accountId: string): SocialAccount | undefined =>
  workspace?.socialAccounts?.find((a: SocialAccount) => a.id === accountId);

// A generic function to update a specific page within the nested state
export const updatePage = (
  state: { workspaces: Workspace[] }, 
  brandId: string, 
  pageId: string, 
  updates: Partial<SocialPage>
): { workspaces: Workspace[] } => {
  return {
    workspaces: state.workspaces.map((w: Workspace) => ({
      ...w,
      socialPages: (w.socialPages || []).map((p: SocialPage) => p.id === pageId
        ? { ...p, ...updates }
        : p),
    }))
  };
};

// Default icons and colors
export const defaultIcons = [
  "/images/boards/icons/icon-1.svg",
  "/images/boards/icons/icon-2.svg",
  "/images/boards/icons/icon-3.svg",
  "/images/boards/icons/icon-4.svg",
  "/images/boards/icons/icon-5.svg",
  "/images/boards/icons/icon-6.svg",
  "/images/boards/icons/icon-7.svg",
  "/images/boards/icons/icon-8.svg",
  "/images/boards/icons/icon-9.svg",
  "/images/boards/icons/icon-10.svg",
  "/images/boards/icons/icon-11.svg",
  "/images/boards/icons/icon-12.svg",
  "/images/boards/icons/icon-13.svg",
  "/images/boards/icons/icon-14.svg",
  "/images/boards/icons/icon-15.svg",
  "/images/boards/icons/icon-16.svg",
];

export const defaultColors = [
  "#125AFF", "#7D68D5", "#349DFE", "#3FAFA0", "#39CAFF", "#FFCB57", "#F87934", "#E85E62",
  "#EC5690", "#B45FC1", "#FB8AEE", "#AC8E81", "#1C1C1C", "#97A7A6", "#5374E0", "#E6E4E2"
];
