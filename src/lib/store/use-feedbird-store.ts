"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import { persist, createJSONStorage } from "zustand/middleware";
import type { 
  Platform, 
  Status, 
  FileKind, 
  ContentFormat,
  SocialAccount, 
  SocialPage,
  PostHistory
} from "@/lib/social/platforms/platform-types";
import { getPlatformOperations } from "../social/platforms";
/** A small interface for your centralized nav items. */
export interface NavLink {
  id: string;
  label: string;
  image?: string;    // e.g. "/images/public/approvals.svg"
  href?: string;
  onClick?: () => void;
}

export type ColumnType =
  | "singleLine"
  | "longText"
  | "attachment"
  | "checkbox"
  | "feedback"
  | "singleSelect"
  | "multiSelect"
  | "date"
  | "lastUpdatedTime";

export interface UserColumn {
  id: string;
  label: string;
  type: ColumnType;
  options?: string[];
}

// Re-export types from platform-types.ts for backward compatibility
export type { Platform, Status, FileKind, ContentFormat };

export interface BaseComment {
  id: string;
  parentId?: string;
  createdAt: Date;
  author: string;
  text: string;
  revisionRequested?: boolean;
}

export interface VersionComment extends BaseComment {
  rect?: { x: number; y: number; w: number; h: number };
}

export interface Version {
  id: string;
  createdAt: Date;
  by: string;
  caption: string;
  file: {
    kind: FileKind;
    url: string;
  };
  comments: VersionComment[];
}

export interface Block {
  id: string;
  kind: FileKind;
  currentVersionId: string;
  versions: Version[];
  comments: BaseComment[]; 
}

export interface CaptionData {
  synced: boolean;
  default: string;
  perPlatform?: Partial<Record<Platform, string>>;
}

export interface Activity {
  id: string;
  postId: string;
  actor: string;
  action: string; 
  at: Date;
}

export interface Post {
  id: string;
  brandId: string;
  caption: CaptionData;
  status: Status;
  format: string;
  publishDate: Date;
  updatedAt: Date;
  platforms: Platform[];  // Array of platforms this post is for
  pages: string[];  // Array of social page IDs
  billingMonth?: string;
  month: number;  // Month number (1-50)

  blocks: Block[];
  comments: BaseComment[]; 
  activities: Activity[];
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  styleGuide?: {
    fonts?: string[];
    colors?: string[];
  };
  platforms?: Platform[];
  socialAccounts: SocialAccount[];
  socialPages: SocialPage[];
  link?: string;
  voice?: string;
  prefs?: string;
  contents: Post[];
}

export interface Workspace {
  id: string;
  name: string;
  logo?: string;
  brands: Brand[];
}

/*─────────────────────────────────────────────────────────────────────*/
/*  Store Interface                                                  */
/*─────────────────────────────────────────────────────────────────────*/
export interface FeedbirdStore {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeBrandId: string | null;

  platformNav: NavLink[];
  boardNav: NavLink[];
  
  /** NEW: Store post history fetched from each social page. Key = pageId. */
  postHistory: Record<string, PostHistory[]>;
  
  /** Loading states for post history sync. Key = pageId. */
  syncingPostHistory: Record<string, boolean>;

  setActiveWorkspace: (id: string) => void;
  setActiveBrand: (id: string) => void;
  connectSocialAccount: (brandId: string, platform: Platform, account: Pick<SocialAccount, "name" | "accountId" | "authToken">) => string;
  disconnectSocialAccount: (brandId: string, accountId: string) => void;
  stageSocialPages: (brandId: string, platform: Platform, pages: SocialPage[], localAccountId: string) => void;
  confirmSocialPage: (brandId: string, pageId: string) => void;
  disconnectSocialPage: (brandId: string, pageId: string) => void;
  checkAccountStatus: (brandId: string, accountId: string) => Promise<void>;
  checkPageStatus: (brandId: string, pageId: string) => Promise<void>;
  deletePagePost: (brandId: string, pageId: string, postId: string) => Promise<void>;
  getPageCounts: () => Record<Platform, number>;
  getActiveWorkspace: () => Workspace | undefined;
  getActiveBrand: () => Brand | undefined;
  getActivePosts: () => Post[];
  syncPostHistory: (brandId: string, pageId: string) => Promise<void>;
  publishPostToAllPages: (postId: string, scheduledTime?: Date) => Promise<void>;
  getPost: (id: string) => Post | undefined;
  updatePost: (pid: string, data: Partial<Post>) => void;
  addWorkspace: (name: string, logo?: string) => string;
  removeWorkspace: (id: string) => void;
  addBrand: (name: string, logo?: string, styleGuide?: Brand['styleGuide'], link?: string, voice?: string, prefs?: string) => string;
  updateBrand: (id: string, data: Partial<Brand>) => void;
  removeBrand: (id: string) => void;
  deletePost: (postId: string) => void;
  approvePost: (id: string) => void;
  requestChanges: (id: string) => void;
  addPost: () => Post | null;
  duplicatePost: (orig: Post) => Post | null;
  setActivePosts: (posts: Post[]) => void;
  sharePostsToBrand: (postIds: string[], targetBrandId: string) => void;
  addBlock: (postId: string, kind: FileKind) => string;
  removeBlock: (postId: string, blockId: string) => void;
  addVersion: (postId: string, blockId: string, ver: Omit<Version, 'id' | 'createdAt' | 'comments'>) => string;
  setCurrentVersion: (postId: string, blockId: string, versionId: string) => void;
  addPostComment: (postId: string, text: string, parentId?: string, revisionRequested?: boolean) => string;
  addBlockComment: (postId: string, blockId: string, text: string, parentId?: string, revisionRequested?: boolean) => string;
  addVersionComment: (postId: string, blockId: string, verId: string, text: string, rect?: { x: number; y: number; w: number; h: number }, parentId?: string, revisionRequested?: boolean) => string;
  addActivity: (act: Omit<Activity, 'id' | 'at'>) => void;
}

const defaultPlatformNav: NavLink[] = [
  {
    id: "notifications",
    label: "Notifications",
    image: "/images/sidebar/notifications-on.svg",
    href: "/notifications",
  },
  {
    id: "approvals",
    label: "Approvals",
    image: "/images/sidebar/approvals.svg",
    href: "/approvals",
  },
  {
    id: "brands",
    label: "Brands",
    image: "/images/sidebar/brands.svg",
    href: "/brands",
  },
  {
    id: "analytics",
    label: "Analytics",
    image: "/images/sidebar/analytics.svg",
    href: "/analytics",
  },
  {
    id: "settings",
    label: "Settings",
    image: "/images/sidebar/settings.svg",
    href: "/settings",
  },
];

const defaultBoardNav: NavLink[] = [
  {
    id: "static-posts",
    label: "Static Posts",
    image: "/images/boards/static-posts.svg",
    href: "/content/static-posts",
  },
  {
    id: "short-form-videos",
    label: "Short-Form Videos",
    image: "/images/boards/short-form-videos.svg",
    href: "/content/short-form-videos",
  },
  {
    id: "email-design",
    label: "Email Design",
    image: "/images/boards/email-design.svg",
    href: "/content/email-design",
  },
];
/*─────────────────────────────────────────────────────────────────────*/
/*  The Store                                                        */
/*─────────────────────────────────────────────────────────────────────*/
export const useFeedbirdStore = create<FeedbirdStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      activeBrandId: null,

      platformNav: defaultPlatformNav,
      boardNav: defaultBoardNav,
      postHistory: {},
      syncingPostHistory: {},
      // getters
      getActiveWorkspace: () =>
        get().workspaces.find((w) => w.id === get().activeWorkspaceId),

      getActiveBrand: () => {
        const ws = get().getActiveWorkspace();
        return ws?.brands.find((b) => b.id === get().activeBrandId);
      },

      getActivePosts: () => {
        const brand = get().getActiveBrand();
        return brand?.contents ?? [];
      },

      publishPostToAllPages: async (postId, scheduledTime) => {
        const store = get();
        const post = store.getPost(postId);
        if (!post) return;

        const brand = store.getActiveBrand();
        if (!brand || brand.id !== post.brandId) {
          console.warn("Active brand mismatch for post:", postId);
          return;
        }
        // Identify pages that match the post's platforms & are connected
        const targetPages = brand.socialPages.filter(
          (pg) => pg.connected && post.pages.includes(pg.id) && pg.platform !== "tiktok"
        );
        if (!targetPages.length) {
          console.warn("No connected pages found for this post's platforms.");
          return;
        }

        // Prepare content & media
        const content = post.caption?.default || "(no caption)";
        const mediaUrls = extractMediaUrls(post.blocks);
        console.log(mediaUrls);
        // Loop over pages => publish
        await Promise.all(
          targetPages.map(async (pg) => {
            const ops = getPlatformOperations(pg.platform as Exclude<Platform, 'tiktok'>);
            if (!ops) return;
            try {
              const result = await ops.publishPost(pg, {
                text: content,
                media: mediaUrls.length > 0 ? {
                  type: post.format === "video" ? "video" : "image",
                  urls: mediaUrls
                } : undefined
              }, { scheduledTime });

              // Append to postHistory in store
              set((state) => {
                const oldHist = state.postHistory[pg.id] ?? [];
                return {
                  postHistory: {
                    ...state.postHistory,
                    [pg.id]: [...oldHist, result],
                  },
                };
              });
            } catch (err) {
              console.error("Failed to publish to page", pg.id, err);
            }
          })
        );

        // Finally, update the post status in the store
        store.updatePost(postId, {
          status: scheduledTime ? "Scheduled" : "Published",
          publishDate: scheduledTime ?? new Date(),
        });
      },

      syncPostHistory : async (brandId, pageId) => {
        const state = get();
        
        // Prevent multiple simultaneous calls to the same pageId
        if (state.syncingPostHistory?.[pageId]) {
          console.log('Already syncing post history for page:', pageId);
          return;
        }

        const brand = state.getActiveBrand();
        if (!brand || brand.id !== brandId) return;

        const page = brand.socialPages.find((p) => p.id === pageId);
        if (!page) return;

        const ops = getPlatformOperations(page.platform as Exclude<Platform, 'tiktok'>);
        if (!ops) {
          console.error("No platform ops for", page.platform);
          return;
        }

        try {
          // Set loading state
          set((state) => ({
            syncingPostHistory: {
              ...state.syncingPostHistory,
              [pageId]: true,
            },
          }));

          const fetched = await ops.getPostHistory(page, 20);
          
          // Single state update to prevent multiple re-renders
          set((state) => ({
            // Update post history
            postHistory: {
              ...state.postHistory,
              [pageId]: fetched,
            },
            // Clear loading state
            syncingPostHistory: {
              ...state.syncingPostHistory,
              [pageId]: false,
            },
            // Update lastSyncAt in the same state update
            workspaces: state.workspaces.map((w) => ({
              ...w,
              brands: w.brands.map((b) => {
                if (b.id !== brandId) return b;
                return {
                  ...b,
                  socialPages: b.socialPages.map((sp) =>
                    sp.id === pageId
                      ? { ...sp, lastSyncAt: new Date() }
                      : sp
                  ),
                };
              }),
            })),
          }));
        } catch (err) {
          console.error("syncPostHistory failed:", err);
          
          // Clear loading state on error
          set((state) => ({
            syncingPostHistory: {
              ...state.syncingPostHistory,
              [pageId]: false,
            },
          }));
          
          throw err; // Re-throw to allow proper error handling
        }
      },

      getPost: (id) => {
        for (const w of get().workspaces) {
          for (const b of w.brands) {
            const found = b.contents.find((p) => p.id === id);
            if (found) return found;
          }
        }
        return undefined;
      },

      // workspace
      addWorkspace: (name, logo) => {
        const wid = nanoid();
        const bid = nanoid();
        const newBrand: Brand = {
          id: bid,
          name: "General",
          logo: undefined,
          socialAccounts: [],
          socialPages: [],
          contents: [],
        };
        set((state) => ({
          workspaces: [
            ...state.workspaces,
            { id: wid, name, logo, brands: [newBrand] },
          ],
        }));
        return wid;
      },
      removeWorkspace: (id) =>
        set((s) => {
          const newWs = s.workspaces.filter((w) => w.id !== id);
          let newActiveW = s.activeWorkspaceId;
          let newActiveB = s.activeBrandId;
          if (s.activeWorkspaceId === id) {
            newActiveW = null;
            newActiveB = null;
          }
          return {
            workspaces: newWs,
            activeWorkspaceId: newActiveW,
            activeBrandId: newActiveB,
          };
        }),
      setActiveWorkspace: (id) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === id);
          return {
            activeWorkspaceId: id,
            activeBrandId: ws?.brands[0]?.id ?? null,
          };
        }),

      // brand
      addBrand: (
        name: string,
        logo?: string,
        styleGuide?: Brand['styleGuide'],
        link?: string,
        voice?: string,
        prefs?: string
      ) => {
        const bid = nanoid();
        const newBrand: Brand = {
          id: bid,
          name,
          logo,
          styleGuide,
          link,
          voice,
          prefs,
          socialAccounts: [],
          socialPages: [],
          contents: [],
        };
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === s.activeWorkspaceId
              ? { ...w, brands: [...w.brands, newBrand] }
              : w
          ),
        }));
        return bid;
      },
      updateBrand: (id, data) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) => ({
            ...w,
            brands: w.brands.map((b) => (b.id === id ? { ...b, ...data } : b)),
          })),
        })),
      removeBrand: (id) =>
        set((s) => {
          const w = s.workspaces.map((ws) => {
            if (ws.id !== s.activeWorkspaceId) return ws;
            return { 
              ...ws, 
              brands: ws.brands.filter((b) => b.id !== id) 
            };
          });
          const brandStillExists = !!w
            .flatMap((X) => X.brands)
            .find((b) => b.id === s.activeBrandId);
          return {
            workspaces: w,
            activeBrandId: brandStillExists ? s.activeBrandId : null,
          };
        }),
      setActiveBrand: (id) => set({ activeBrandId: id }),

      connectSocialAccount: (brandId: string, platform: Platform, account: Pick<SocialAccount, "name" | "accountId" | "authToken">) => {
        let localReturnId = crypto.randomUUID();
        set((state) => ({
          workspaces: state.workspaces.map((w) => ({
            ...w,
            brands: w.brands.map((b) => {
              if (b.id !== brandId) return b;

              // 1) Check if an existing account has the same real accountId
              const existingAccount = b.socialAccounts?.find(
                (a) => a.accountId === account.accountId
              );
              if (existingAccount) {
                localReturnId = existingAccount.id;
                return {
                  ...b,
                  socialAccounts: b.socialAccounts.map((a) =>
                    a.accountId === account.accountId
                      ? {
                          ...a,
                          connected: true,
                          status: "active",
                          authToken: account.authToken,
                        }
                      : a
                  ),
                };
              }

              // 2) Otherwise, create a new local account
              const newAccount: SocialAccount = {
                id: localReturnId,
                name: account.name,
                accountId: account.accountId,
                platform,
                authToken: account.authToken,
                connected: true,
                status: "active",
              };
              return {
                ...b,
                socialAccounts: [...(b.socialAccounts || []), newAccount],
              };
            }),
          })),
        }));
        return localReturnId;
      },

      disconnectSocialAccount: (brandId: string, accountId: string) => {
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((b) => {
              if (b.id !== brandId) return b;

              // Remove the given account & all its pages
              const account = b.socialAccounts.find((a) => a.id === accountId);
              if (!account) return b;

              return {
                ...b,
                socialAccounts: b.socialAccounts.filter(
                  (a) => a.id !== accountId
                ),
                // remove pages of that account's platform
                socialPages: b.socialPages.filter(
                  (p) => p.platform !== account.platform
                ),
              };
            }),
          })),
        }));
      },

      stageSocialPages: (brandId, platform, pages, localAccountId) => {
        set((state) => {
          const newWs = state.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((b) => {
              if (b.id !== brandId) return b;

              const existing = b.socialPages ?? [];

              // For each page => if we find a matching pageId, update accountId.
              const incoming = pages.map((p) => {
                // does brand already have a page w/ pageId === p.pageId?
                const found = existing.find((ex) => ex.pageId === p.pageId);
                if (found) {
                  // Reassign this page's accountId
                  return {
                    ...found,
                    accountId: localAccountId,
                    connected: found.connected, 
                    status: toPageStatus(found.status),
                  };
                } else {
                  // new page => set accountId to localAccountId, connected=false
                  return {
                    ...p,
                    accountId: localAccountId,
                    connected: false,
                    status: toPageStatus(p.status),
                  };
                }
              });

              // Merge them back into the brand's socialPages
              const merged = [...existing];
              incoming.forEach((pg) => {
                const idx = merged.findIndex((m) => m.pageId === pg.pageId);
                if (idx >= 0) {
                  merged[idx] = pg; // update existing
                } else {
                  merged.push(pg); // new
                }
              });

              return { ...b, socialPages: merged };
            }),
          }));
          return { workspaces: newWs };
        });
      },

      confirmSocialPage: async (brandId, pageId) => {
        const brand = get().getActiveBrand();
        if (!brand || brand.id !== brandId) return;

        const page = brand.socialPages.find((p) => p.id === pageId);
        if (!page) {
          console.error("No matching page in brand.socialPages", pageId);
          return;
        }
        // find local account => must match page.accountId
        const acct = brand.socialAccounts.find((a) => a.id === page.accountId);
        if (!acct) {
          console.error("No matching account for page", page);
          return;
        }

        const ops = getPlatformOperations(page.platform as Exclude<Platform, 'tiktok'>);
        if (!ops) {
          console.error("No platform ops for", page.platform);
          return;
        }

        // Actually connect the page at the platform level
        const finalPage = await ops.connectPage(acct, page.pageId);

        // store final results in feedbird store
        set((s) => {
          const newWs = s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((b) => {
              if (b.id !== brandId) return b;
              return {
                ...b,
                socialPages: b.socialPages.map((sp) => {
                  if (sp.id === pageId) {
                    // Overwrite with finalPage info
                    return {
                      ...sp,
                      ...finalPage,
                      connected: true,
                      status: finalPage.status ?? "active",
                    };
                  }
                  return sp;
                }),
              };
            }),
          }));
          return { workspaces: newWs };
        });
      },

      disconnectSocialPage: (brandId: string, pageId: string) => {
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((b) => {
              if (b.id !== brandId) return b;
              // Remove the page from socialPages
              return {
                ...b,
                socialPages: (b.socialPages ?? []).filter(
                  (p) => p.id !== pageId
                ),
              };
            }),
          })),
        }));
      },

      checkAccountStatus: async (brandId: string, accountId: string) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => ({
            ...w,
            brands: w.brands.map((b) => {
              if (b.id === brandId) {
                return {
                  ...b,
                  socialAccounts: b.socialAccounts.map((a) => {
                    if (a.id === accountId) {
                      return {
                        ...a,
                        status: a.connected ? "active" : "disconnected",
                      };
                    }
                    return a;
                  }),
                };
              }
              return b;
            }),
          })),
        }));
      },

      checkPageStatus: async (brandId: string, pageId: string) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => ({
            ...w,
            brands: w.brands.map((b) => {
              if (b.id === brandId) {
                return {
                  ...b,
                  socialPages: b.socialPages.map((p) => {
                    if (p.id === pageId) {
                      return {
                        ...p,
                        status: p.connected ? "active" : "disconnected",
                      };
                    }
                    return p;
                  }),
                };
              }
              return b;
            }),
          })),
        }));
      },

      deletePagePost: async (brandId, pageId, postId) => {
        const st = get();

        // locate page & ops
        const brand = st.workspaces
          .flatMap(w => w.brands)
          .find(b => b.id === brandId);
        const page  = brand?.socialPages.find(p => p.id === pageId);
        if (!brand || !page) {
          console.error("deletePagePost: page not found");
          return;
        }
        const ops = getPlatformOperations(page.platform as Exclude<Platform, 'tiktok'>);
        if (!ops?.deletePost) {
          console.error("deletePagePost: ops.deletePost not implemented");
          return;
        }

        try {
          await ops.deletePost(page, postId);

          /* remove locally */
          set(state => {
            const old = state.postHistory[pageId] ?? [];
            return {
              postHistory: {
                ...state.postHistory,
                [pageId]: old.filter(p => p.postId !== postId)
              }
            };
          });
        } catch (err) {
          console.error("deletePagePost failed:", err);
          throw err;
        }
      },

      getPageCounts: () => {
        const brand = get().getActiveBrand();
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

        brand?.socialPages?.forEach((p) => {
          if (p.connected && p.status === "active") {
            const platform = p.platform as Platform;
            result[platform] = (result[platform] ?? 0) + 1;
          }
        });

        return result;
      },

      // posts
      updatePost: (pid, data) => 
        set((s) => {
          const newWs = s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((br) => ({
              ...br,
              contents: br.contents.map((p) => {
                if (p.id !== pid) return p;
                const updated = { ...p, ...data };
                // auto-update updatedAt if not final
                const nonFinal = new Set([
                  "Draft","Pending Approval","Needs Revisions",
                  "Revised","Approved","Scheduled"
                ]);
                if (nonFinal.has(p.status)) {
                  updated.updatedAt = new Date();
                }
                return updated;
              }),
            })),
          }));
          return { workspaces: newWs };
        }),
      deletePost: (postId) =>
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((br) => ({
              ...br,
              contents: br.contents.filter((p) => p.id !== postId),
            })),
          })),
        })),
      approvePost: (id) => get().updatePost(id, { status: "Approved" }),
      requestChanges: (id) => get().updatePost(id, { status: "Needs Revisions" }),

      addPost: () => {
        const st = get();
        const brand = st.getActiveBrand();
        if (!brand) return null;
        const pid = nanoid();
        const newPost: Post = {
          id: pid,
          brandId: brand.id,
          caption: { synced: true, default: "New Post" },
          status: "Draft",
          format: "static-image",
          publishDate: new Date(),
          updatedAt: new Date(),
          platforms: [],
          pages: [],
          blocks: [],
          comments: [],
          activities: [],
          month: 1,
        };
        brand.contents.push(newPost);
        set({ workspaces: [...st.workspaces] });
        return newPost;
      },
      duplicatePost: (orig) => {
        const st = get();
        const brand = st.getActiveBrand();
        if (!brand) return null;
        const copy: Post = {
          ...orig,
          id: "dup-" + nanoid(),
          updatedAt: new Date(),
        };
        brand.contents.push(copy);
        set({ workspaces: [...st.workspaces] });
        return copy;
      },
      setActivePosts: (posts) => {
        set((s) => {
          const brand = s.getActiveBrand();
          if (!brand) return {};
          brand.contents = posts;
          return { workspaces: [...s.workspaces] };
        });
      },
      sharePostsToBrand: (postIds, targetBrandId) => {
        const st = get();
        let targ: Brand | undefined;
        outer: for (const w of st.workspaces) {
          for (const b of w.brands) {
            if (b.id === targetBrandId) {
              targ = b; break outer;
            }
          }
        }
        if (!targ) return;
        const newArr: Post[] = [];
        for (const pid of postIds) {
          const ex = st.getPost(pid);
          if (!ex) continue;
          const cloned: Post = {
            ...ex,
            id: "share-" + nanoid(),
            brandId: targ.id,
            updatedAt: new Date(),
          };
          newArr.push(cloned);
        }
        if (newArr.length) {
          targ.contents.push(...newArr);
          set({ workspaces: [...st.workspaces] });
        }
      },

      // block / version
      addBlock: (postId, kind) => {
        const bid = nanoid();
        const newBlock: Block = {
          id: bid,
          kind,
          currentVersionId: "",
          versions: [],
          comments: []
        };
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((br) => ({
              ...br,
              contents: br.contents.map((p) => {
                if (p.id !== postId) return p;
                return { ...p, blocks: [...p.blocks, newBlock] };
              }),
            })),
          })),
        }));
        return bid;
      },
      removeBlock: (postId, blockId) => {
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((br) => ({
              ...br,
              contents: br.contents.map((p) => {
                if (p.id !== postId) return p;
                return {
                  ...p,
                  blocks: p.blocks.filter((b) => b.id !== blockId),
                };
              }),
            })),
          })),
        }));
      },
      addVersion: (postId, blockId, ver) => {
        const newVid = nanoid();
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((br) => ({
              ...br,
              contents: br.contents.map((p) => {
                if (p.id !== postId) return p;
                return {
                  ...p,
                  blocks: p.blocks.map((b) => {
                    if (b.id !== blockId) return b;
                    const newV: Version = {
                      ...ver,
                      id: newVid,
                      createdAt: new Date(),
                      comments: []
                    };
                    const cvid = b.currentVersionId || newVid;
                    return {
                      ...b,
                      versions: [...b.versions, newV],
                      currentVersionId: cvid,
                    };
                  })
                };
              }),
            })),
          })),
        }));
        return newVid;
      },
      setCurrentVersion: (postId, blockId, versionId) => {
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((br) => ({
              ...br,
              contents: br.contents.map((p) => {
                if (p.id !== postId) return p;
                return {
                  ...p,
                  blocks: p.blocks.map((b) => 
                    b.id === blockId
                      ? { ...b, currentVersionId: versionId }
                      : b
                  ),
                };
              }),
            })),
          })),
        }));
      },

      // Comments
      addPostComment: (postId, text, parentId, revisionRequested) => {
        const cid = nanoid();
        const now = new Date();
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((br) => ({
              ...br,
              contents: br.contents.map((p) => {
                if (p.id !== postId) return p;
                const c: BaseComment = {
                  id: cid,
                  parentId,
                  createdAt: now,
                  author: "Me",
                  text,
                  revisionRequested
                };
                return {
                  ...p,
                  comments: [...p.comments, c],
                };
              }),
            })),
          })),
        }));
        return cid;
      },
      addBlockComment: (postId, blockId, text, parentId, revisionRequested) => {
        const cid = nanoid();
        const now = new Date();
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((br) => ({
              ...br,
              contents: br.contents.map((p) => {
                if (p.id !== postId) return p;
                return {
                  ...p,
                  blocks: p.blocks.map((b) => {
                    if (b.id !== blockId) return b;
                    const c: BaseComment = {
                      id: cid,
                      parentId,
                      createdAt: now,
                      author: "Me",
                      text,
                      revisionRequested
                    };
                    return {
                      ...b,
                      comments: [...b.comments, c],
                    };
                  }),
                };
              }),
            })),
          })),
        }));
        return cid;
      },
      addVersionComment: (
        postId, blockId, verId, text, rect, parentId, revisionRequested
      ) => {
        const cid = nanoid();
        const now = new Date();
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((br) => ({
              ...br,
              contents: br.contents.map((p) => {
                if (p.id !== postId) return p;
                return {
                  ...p,
                  blocks: p.blocks.map((b) => {
                    if (b.id !== blockId) return b;
                    return {
                      ...b,
                      versions: b.versions.map((v) => {
                        if (v.id !== verId) return v;
                        const c: VersionComment = {
                          id: cid,
                          parentId,
                          createdAt: now,
                          author: "Me",
                          text,
                          revisionRequested
                        };
                        if (rect) c.rect = rect;
                        return {
                          ...v,
                          comments: [...v.comments, c],
                        };
                      }),
                    };
                  })
                };
              }),
            })),
          })),
        }));
        return cid;
      },

      // Activities
      addActivity: (act) => {
        const id = nanoid();
        set((s) => ({
          workspaces: s.workspaces.map((ws) => ({
            ...ws,
            brands: ws.brands.map((br) => ({
              ...br,
              contents: br.contents.map((p) => {
                if (p.id !== act.postId) return p;
                return {
                  ...p,
                  activities: [
                    {
                      ...act,
                      id,
                      at: new Date(),
                    },
                    ...p.activities
                  ],
                };
              }),
            })),
          })),
        }));
      },
    }),
    {
      name: "feedbird-v5",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

/* Helper: Extract URLs from post.blocks that contain images, etc. */
function extractMediaUrls(blocks: Block[]): string[] {
  if (!blocks?.length) return [];

  return blocks.flatMap((block) => {
    // 1 — locate the version we should take
    const version =
      block.versions.find((v) => v.id === block.currentVersionId) ??
      block.versions[block.versions.length - 1]; // fallback: latest

    // 2 — return its URL if present & truthy
    return version?.file?.url ? [version.file.url] : [];
  });
}
// Helper to coerce any value to PageStatus
function toPageStatus(val: any): import("@/lib/social/platforms/platform-types").PageStatus {
  return ["active", "expired", "pending", "disconnected"].includes(val) ? val : "pending";
}