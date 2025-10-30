import { createPersistedStore, toPageStatus, updatePage } from './store-utils';
import { socialAccountApi } from '@/lib/api/api-service';
import { getPlatformOperations } from "../social/platforms";
import { withLoading } from "../utils/loading/loading-store";
import type { 
  Platform, 
  SocialAccount, 
  SocialPage, 
  PostHistory,
  Workspace
} from './types';

export interface SocialStore {
  // State
  postHistory: Record<string, PostHistory[]>;
  nextPage: Record<string, number | string | null | undefined>;
  syncingPostHistory: Record<string, boolean>;

  // Social account methods
  connectSocialAccount: (brandId: string, platform: Platform, account: Pick<SocialAccount, "name" | "accountId">) => string;
  stageSocialPages: (brandId: string, platform: Platform, pages: SocialPage[], localAccountId: string) => void;
  confirmSocialPage: (brandId: string, pageId: string) => Promise<void>;
  disconnectSocialPage: (brandId: string, pageId: string) => Promise<void>;
  checkAccountStatus: (brandId: string, accountId: string) => Promise<void>;
  checkPageStatus: (brandId: string, pageId: string) => Promise<void>;
  deletePagePost: (brandId: string, pageId: string, postId: string) => Promise<void>;
  getPageCounts: () => Record<Platform, number>;
  
  // Database-first social account methods
  loadSocialAccounts: (brandId: string) => Promise<void>;
  handleOAuthSuccess: (brandId: string) => Promise<void>;
  syncPostHistory: (brandId: string, pageId: string, nextPage?: number | string | null | undefined) => Promise<void>;
}

export const useSocialStore = createPersistedStore<SocialStore>(
  "social-store",
  (set, get) => ({
    // State
    postHistory: {},
    nextPage: {},
    syncingPostHistory: {},

    // Social account methods
    connectSocialAccount: (brandId: string, platform: Platform, account: Pick<SocialAccount, "name" | "accountId">) => {
      let localReturnId = crypto.randomUUID();
      // This will need to access workspace store to update social accounts
      // For now, return the ID - will be handled in main store composition
      return localReturnId;
    },

    stageSocialPages: (brandId, platform, pages, localAccountId) => {
      // This will need to access workspace store to update social pages
      // For now, do nothing - will be handled in main store composition
    },

    confirmSocialPage: async (brandId, pageId) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const ws = workspaceStore.getActiveWorkspace();
      if (!ws) return;

      const page = (ws?.socialPages || []).find((p: SocialPage) => p.id === pageId);
      if (!page) throw new Error(`Page with ID ${pageId} not found.`);
      
      /* TikTok profile == page; no page-level API available in sandbox.
       * We therefore skip the remote connect call and simply flip the
       * staged page to connected=true locally. */
      if (page.platform === 'tiktok') {
        // This will need to access workspace store to update page status
        // For now, do nothing - will be handled in main store composition
        return;
      }

      const acct = (ws?.socialAccounts || []).find((a: SocialAccount) => a.id === page.accountId);
      if (!acct) throw new Error(`Account for page ${pageId} not found.`);

      const ops = getPlatformOperations(page.platform);
      if (!ops) throw new Error(`No platform operations for ${page.platform}`);

      try {
        // Actually connect the page at the platform level
        const finalPage = await ops.connectPage(acct, page.pageId);

        // This will need to access workspace store to update page with final data
        // For now, do nothing - will be handled in main store composition
      } catch (error) {
        console.error(`Failed to connect page ${page.name}:`, error);
        // Propagate the error to be caught by the UI
        throw error;
      }
    },

    disconnectSocialPage: async (brandId: string, pageId: string) => {
      try {
        const { useWorkspaceStore } = require('./workspace-store');
        const workspaceStore = useWorkspaceStore.getState();
        const ws = workspaceStore.getActiveWorkspace();
        if (!ws) throw new Error('No active workspace');
        // Use proper API service instead of raw fetch
        await socialAccountApi.disconnectSocial({
          workspaceId: ws.id,
          pageId
        });

        // Reload social accounts to get updated data
        await get().loadSocialAccounts(ws.id);
      } catch (error) {
        console.error('Failed to disconnect page:', error);
        throw error;
      }
    },

    checkAccountStatus: async (brandId: string, accountId: string) => {
      // This will need to access workspace store to update account status
      // For now, do nothing - will be handled in main store composition
    },

    checkPageStatus: async (brandId: string, pageId: string) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const ws = workspaceStore.workspaces.find((w: Workspace) => w.brand?.id === brandId);
      const pages = (ws?.socialPages || []) as SocialPage[];
      const page = pages.find(p => p.id === pageId);
      if (!page) return;

      try {
        const ops = getPlatformOperations(page.platform);
        if (!ops?.checkPageStatus) {
          // If checkPageStatus isn't supported, we can't verify, so we'll assume it's active.
          // This will need to access workspace store to update page status
          // For now, do nothing - will be handled in main store composition
          return;
        }

        const freshPage = await ops.checkPageStatus(page);
        // This will need to access workspace store to update page with fresh data
        // For now, do nothing - will be handled in main store composition
      } catch (error) {
        console.error(`Failed to check status for page ${page.name}:`, error);
        // This will need to access workspace store to update page status to error
        // For now, do nothing - will be handled in main store composition
        throw error; // Re-throw so the UI can catch it
      }
    },

    deletePagePost: async (brandId, pageId, postId) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();

      // locate page & ops
      const ws = workspaceStore.getActiveWorkspace();
      const page  = (ws?.socialPages || []).find((p: SocialPage) => p.id === pageId);
      if (!ws || !page) {
        console.error("deletePagePost: page not found");
        return;
      }
      const ops = getPlatformOperations(page.platform);
      if (!ops?.deletePost) {
        console.error("deletePagePost: ops.deletePost not implemented");
        return;
      }

      try {
        await ops.deletePost(page, postId);

        /* remove locally */
        set((state: SocialStore) => {
          const old = state.postHistory[pageId] ?? [];
          return {
            postHistory: {
              ...state.postHistory,
              [pageId]: old.filter((p: PostHistory) => p.postId !== postId)
            }
          };
        });
      } catch (err) {
        console.error("deletePagePost failed:", err);
        throw err;
      }
    },

    getPageCounts: () => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const ws = workspaceStore.getActiveWorkspace();
      const platforms = [
        "facebook", "instagram", "linkedin", "pinterest",
        "youtube", "tiktok", "google"
      ] as const;
      
      const result: Record<Platform, number> = {
        facebook: 0,
        instagram: 0,
        linkedin: 0,
        pinterest: 0,
        youtube: 0,
        tiktok: 0,
        google: 0,
      };

      (ws?.socialPages || []).forEach((p: SocialPage) => {
        if (p.connected && p.status === "active") {
          const platform = p.platform as Platform;
          result[platform] = (result[platform] ?? 0) + 1;
        }
      });

      return result;
    },

    // Database-first social account methods
    loadSocialAccounts: async (brandId: string) => {
      try {
        // Use proper API service instead of raw fetch
        const { useWorkspaceStore } = require('./workspace-store');
        const workspaceStore = useWorkspaceStore.getState();
        const ws = workspaceStore.getActiveWorkspace();
        if (!ws) throw new Error('No active workspace');
        const accounts = await socialAccountApi.getSocialAccounts(ws.id);
        
        // Extract all pages from all accounts into a flat array (exclude sensitive tokens)
        const allPages = accounts.flatMap((acc: SocialAccount) => 
          (acc.pages || []).map((page: SocialPage) => ({
            id: page.id,
            platform: page.platform,
            entityType: page.entityType || 'page',
            name: page.name,
            pageId: page.pageId,
            connected: page.connected,
            status: page.status,
            accountId: acc.id, // Link to the account
            socialSetId: page.socialSetId ?? null,
            statusUpdatedAt: page.statusUpdatedAt ? new Date(page.statusUpdatedAt) : undefined,
            lastSyncAt: page.lastSyncAt ? new Date(page.lastSyncAt) : undefined,
            followerCount: page.followerCount,
            postCount: page.postCount,
            metadata: page.metadata
          }))
        );
        
        // This will need to access workspace store to update social accounts and pages
        // For now, do nothing - will be handled in main store composition

        console.log('state.workspaces', workspaceStore.workspaces.find((w: any) => w.id == ws.id));

      } catch (error) {
        console.error('Failed to load social accounts:', error);
        // You can add toast notification here if needed
      }
    },

    handleOAuthSuccess: async (brandId: string) => {
      try {
        await get().loadSocialAccounts(brandId);
        // You can add success toast here if needed
      } catch (error) {
        console.error('Failed to handle OAuth success:', error);
        // You can add error toast here if needed
      }
    },

    syncPostHistory: (brandId, pageId, nextPage?: number | string | null | undefined) => {
      return withLoading(
        async () => {
          const { useWorkspaceStore } = require('./workspace-store');
          const workspaceStore = useWorkspaceStore.getState();
          const workspace = workspaceStore.getActiveWorkspace();
          if (!workspace?.brand || workspace.brand.id !== brandId) {
            throw new Error("Brand not found");
          }

          const brand = workspace.brand;
          const page = (workspace.socialPages || []).find((p: SocialPage) => p.id === pageId);
          if (!page) throw new Error("Page not found");

          const ops = getPlatformOperations(page.platform);
          if (!ops) throw new Error(`Platform operations not found for ${page.platform}`);

          // Fix: nextPage can be null, but getPostHistory expects string | number | undefined
          const fetched = await ops.getPostHistory(page, 20, nextPage ?? undefined);
          
          set((state: SocialStore) => {
            const existingHistory = state.postHistory[pageId] || [];
            const newHistory = nextPage ? [...existingHistory, ...fetched.posts] : fetched.posts;
            
            return {
              postHistory: { ...state.postHistory, [pageId]: newHistory },
              nextPage: { ...state.nextPage, [pageId]: fetched.nextPage },
              // This will need to access workspace store to update page lastSyncAt
              // For now, just return the social store updates
            };
          });
        },
        {
          loading: "Syncing post history...",
          success: "Post history synced successfully!",
          error: "Failed to sync post history."
        }
      );
    },
  })
);
