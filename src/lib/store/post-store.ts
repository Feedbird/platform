import { createPersistedStore, determineCorrectStatus } from './store-utils';
import { storeApi, commentApi, activityApi } from '@/lib/api/api-service';
import { getCurrentUserDisplayNameFromStore } from "@/lib/utils/user-utils";
import { mapTikTokSettingsToPublishOptions } from "@/lib/utils/tiktok-settings-mapper";
import { getPlatformOperations } from "../social/platforms";
import { withLoading } from "../utils/loading/loading-store";
import { v4 as uuidv4 } from 'uuid';
import type { 
  Post, 
  Block, 
  Version, 
  BaseComment, 
  VersionComment, 
  Activity, 
  Status, 
  FileKind,
  Platform,
  SocialPage,
  Workspace,
  Board
} from './types';

export interface PostStore {
  // Post methods
  getPost: (id: string) => Post | undefined;
  getActivePosts: () => Post[];
  getAllPosts: () => Post[];
  addPost: (boardId?: string) => Promise<Post | null>;
  bulkAddPosts: (boardId: string, posts: Omit<Post, 'id' | 'workspaceId' | 'boardId' | 'updatedAt'>[]) => Promise<Post[]>;
  duplicatePost: (orig: Post) => Promise<Post | null>;
  updatePost: (pid: string, data: Partial<Post>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  bulkDeletePosts: (postIds: string[]) => Promise<void>;
  approvePost: (id: string) => Promise<void>;
  requestChanges: (id: string, comment?: string) => Promise<void>;
  setPostRevised: (id: string) => Promise<void>;
  setActivePosts: (posts: Post[]) => void;
  sharePostsToBrand: (postIds: string[], targetBrandId: string) => void;
  publishPostToAllPages: (postId: string, scheduledTime?: Date) => Promise<void>;
  updatePostStatusesBasedOnTime: () => void;

  // Block and version methods
  addBlock: (postId: string, kind: FileKind) => string;
  removeBlock: (postId: string, blockId: string) => void;
  addVersion: (postId: string, blockId: string, ver: Omit<Version, 'id' | 'createdAt' | 'comments'>) => string;
  setCurrentVersion: (postId: string, blockId: string, versionId: string) => void;

  // Comment methods
  addPostComment: (postId: string, text: string, parentId?: string, revisionRequested?: boolean) => Promise<string>;
  addBlockComment: (postId: string, blockId: string, text: string, parentId?: string, revisionRequested?: boolean) => Promise<string>;
  addVersionComment: (
    postId: string,
    blockId: string,
    verId: string,
    text: string,
    rect?: { x: number; y: number; w: number; h: number },
    parentId?: string,
    revisionRequested?: boolean
  ) => Promise<string>;

  // Activity methods
  addActivity: (act: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const usePostStore = createPersistedStore<PostStore>(
  "post-store",
  (set, get) => ({
    getPost: (id: string) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const workspace = workspaceStore.getActiveWorkspace();
      if (workspace) {
        for (const board of workspace.boards) {
          const found = board.posts.find((p: Post) => p.id === id);
          if (found) return found;
        }
      }
      return undefined;
    },

    getActivePosts: () => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const workspace = workspaceStore.getActiveWorkspace();
      const board_id = workspaceStore.activeBoardId;
      if (!workspace || !board_id) return [];
      
      const board = workspace.boards.find((b: Board) => b.id === board_id);
      console.log('board', board);
      return board?.posts ?? [];
    },

    getAllPosts: () => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const workspace = workspaceStore.getActiveWorkspace();
      if (!workspace) return [];
      
      return workspace.boards.flatMap((board: Board) => board.posts);
    },

    addPost: async (board_id?: string) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const ws = workspaceStore.getActiveWorkspace();
      if (!ws) return null;
      const bId = board_id ?? workspaceStore.activeBoardId ?? (ws?.boards[0]?.id ?? "default");
      const userEmail = (get() as any).user?.email;

      if (!userEmail) {
        console.error('No user email available for creating post');
        return null;
      }

      const postId = await storeApi.createPostAndUpdateStore(ws.id, bId, {
        caption: { synced: true, default: "" },
        status: "Draft",
        format: "",
        platforms: [],
        pages: [],
        month: 1,
      }, userEmail);

      return get().getPost(postId) ?? null;
    },

    bulkAddPosts: async (boardId, posts) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const ws = workspaceStore.getActiveWorkspace();
      if (!ws) return [];
      const userEmail = (get() as any).user?.email;

      if (!userEmail) {
        console.error('No user email available for bulk creating posts');
        return [];
      }

      // Transform posts to API format
      const postsData = posts.map(post => {
        const postData: any = {
          workspaceId: ws.id,
          boardId: boardId,
          caption: post.caption,
          status: post.status,
          format: post.format,
          platforms: post.platforms,
          pages: post.pages,
          month: post.month,
          blocks: post.blocks,
          comments: post.comments,
          activities: post.activities,
        };

        // Only include optional fields if they have values
        if (post.publishDate) {
          postData.publishDate = post.publishDate.toISOString();
        }
        if (post.billingMonth) {
          postData.billing_month = post.billingMonth;
        }
        if (post.settings) {
          postData.settings = post.settings;
        }
        if (post.hashtags) {
          postData.hashtags = post.hashtags;
        }

        return postData;
      });

      const postIds = await storeApi.bulkCreatePostsAndUpdateStore(ws.id, boardId, postsData, userEmail);

      // Get the created posts from store
      const createdPosts = postIds.map(id => get().getPost(id)).filter(Boolean) as Post[];
      return createdPosts;
    },

    duplicatePost: async (orig) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const workspace = workspaceStore.getActiveWorkspace();
      if (!workspace) return null;

      const board = workspace.boards.find((b: Board) => b.id === orig.boardId);
      if (!board) return null;

      const userEmail = (get() as any).user?.email;
      if (!userEmail) {
        console.error('No user email available for duplicating post');
        return null;
      }

      try {
        // Create duplicated post in database
        const postData: any = {
          caption: orig.caption,
          status: orig.status,
          format: orig.format,
          platforms: orig.platforms,
          pages: orig.pages,
          month: orig.month,
          blocks: orig.blocks,
          comments: orig.comments,
          activities: orig.activities,
        };

        // Only include publish_date if it exists
        if (orig.publishDate) {
          postData.publishDate = orig.publishDate.toISOString();
        }

        // Only include optional fields if they have values
        if (orig.billingMonth) {
          postData.billing_month = orig.billingMonth;
        }
        if (orig.settings) {
          postData.settings = orig.settings;
        }
        if (orig.hashtags) {
          postData.hashtags = orig.hashtags;
        }

        const postId = await storeApi.createPostAndUpdateStore(workspace.id, orig.boardId, postData, userEmail);

        // Get the created post from updated store
        const duplicatedPost = get().getPost(postId);
        return duplicatedPost || null;
      } catch (error) {
        console.error('Failed to duplicate post:', error);
        return null;
      }
    },

    updatePost: async (pid, data) => {
      const st = get();
      const prev = st.getPost(pid);
      const isApproving = data?.status === 'Approved';
      const wasNotScheduled = prev?.status !== 'Scheduled';
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const ws = workspaceStore.getActiveWorkspace();
      const board = ws?.boards.find((b: Board) => b.id === prev?.boardId);
      const shouldAuto = board?.rules?.autoSchedule === true;
      const userEmail = (get() as any).user?.email;

      if (isApproving && wasNotScheduled && shouldAuto) {
        await storeApi.autoScheduleAndUpdateStore(pid, "Scheduled");
      } else {
        await storeApi.updatePostAndUpdateStore(pid, data, userEmail);
      }
    },

    deletePost: async (postId) => {
      await storeApi.deletePostAndUpdateStore(postId);
    },

    bulkDeletePosts: async (postIds) => {
      await storeApi.bulkDeletePostsAndUpdateStore(postIds);
    },

    approvePost: async (id) => {
      const post = get().getPost(id);
      if (!post) return;
      
      // Define which statuses allow approval actions
      const allowedStatusesForApproval = [
        "Pending Approval",
        "Revised", 
        "Needs Revisions",
        "Approved"
      ];
      
      // Only approve if the status allows it
      if (allowedStatusesForApproval.includes(post.status)) {
        await get().updatePost(id, { status: "Approved" });
        // Add activity
        const { useWorkspaceStore } = require('./workspace-store');
        const workspaceStore = useWorkspaceStore.getState();
        const workspace = workspaceStore.getActiveWorkspace();
        if (workspace) {
          await get().addActivity({
            postId: id,
            workspaceId: workspace.id,
            actorId: (get() as any).user?.id || '',
            type: "approved"
          });
        }
      }
    },

    requestChanges: async (id, comment?: string) => {
      console.log("requestChanges", id, comment);
      const post = get().getPost(id);
      if (!post) return;
      
      // Define which statuses allow revision actions
      const allowedStatusesForRevision = [
        "Pending Approval",
        "Revised", 
        "Needs Revisions",
        "Approved"
      ];
      
      // Only request changes if the status allows it
      if (allowedStatusesForRevision.includes(post.status)) {
        await get().updatePost(id, { status: "Needs Revisions" });
        console.log("requestChanges", id, comment);
        // Add activity
        const { useWorkspaceStore } = require('./workspace-store');
        const workspaceStore = useWorkspaceStore.getState();
        const workspace = workspaceStore.getActiveWorkspace();
        if (workspace) {
          await get().addActivity({
            postId: id,
            workspaceId: workspace.id,
            actorId: (get() as any).user?.id || '',
            type: "revision_request",
            metadata: {
              revisionComment: comment
            }
          });
        }
      }
    },

    setPostRevised: async (id) => {
      const post = get().getPost(id);
      if (!post) return;
      
      // Define which statuses allow setting to revised
      const allowedStatusesForRevised = [
        "Needs Revisions",
      ];
      
      // Only set to revised if the status allows it
      if (allowedStatusesForRevised.includes(post.status)) {
        await get().updatePost(id, { status: "Revised" });
        // Add activity
        const { useWorkspaceStore } = require('./workspace-store');
        const workspaceStore = useWorkspaceStore.getState();
        const workspace = workspaceStore.getActiveWorkspace();
        if (workspace) {
          await get().addActivity({
            postId: id,
            workspaceId: workspace.id,
            actorId: (get() as any).user?.id || '',
            type: "revised"
          });
        }
      }
    },

    setActivePosts: (posts) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const workspace = workspaceStore.getActiveWorkspace();
      const currentBoardId = workspaceStore.activeBoardId;
      if (!workspace || !currentBoardId) return;
      
      // Find the current board and update its posts
      const board = workspace.boards.find((b: Board) => b.id === currentBoardId);
      if (board) {
        board.posts = posts;
      }
      
      // Update workspace store
      useWorkspaceStore.setState({ workspaces: [...workspaceStore.workspaces] });
    },

    sharePostsToBrand: (postIds, targetBrandId) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      let targetWorkspace: Workspace | undefined;
      let targetBoard: Board | undefined;
      
      outer: for (const w of workspaceStore.workspaces) {
        if (w.brand && w.brand.id === targetBrandId) {
          targetWorkspace = w;
          // Use the first board as target for shared posts
          targetBoard = w.boards[0];
          break outer;
        }
      }
      
      if (!targetWorkspace || !targetBoard) return;
      
      const newArr: Post[] = [];
      for (const pid of postIds) {
        const ex = get().getPost(pid);
        if (!ex) continue;
        const cloned: Post = {
          ...ex,
          id: "share-" + uuidv4(),
          workspaceId: targetWorkspace.id,
          boardId: targetBoard.id,
          updatedAt: new Date(),
        };
        
        // Apply business rule to shared post
        const correctStatus = determineCorrectStatus(cloned.status, cloned.publishDate);
        cloned.status = correctStatus;
        
        newArr.push(cloned);
      }
      if (newArr.length) {
        targetBoard.posts.push(...newArr);
        useWorkspaceStore.setState({ workspaces: [...workspaceStore.workspaces] });
      }
    },

    publishPostToAllPages: (postId, scheduledTime) => {
      return withLoading(
        async () => {
          const { useWorkspaceStore } = require('./workspace-store');
          const workspaceStore = useWorkspaceStore.getState();
          const workspace = workspaceStore.getActiveWorkspace();
          const post = get().getPost(postId);

          if (!workspace || !post) {
            throw new Error("Workspace or Post not found");
          }

          get().updatePost(postId, { status: "Publishing" });
          
          // Add scheduling activity if scheduled
          if (scheduledTime) {
            await get().addActivity({
              postId,
              workspaceId: workspace.id,
              actorId: (get() as any).user?.id || '',
              type: "scheduled",
              metadata: {
                publishTime: scheduledTime
              }
            });
          }

          // Helper: convert any URL (data: or http(s):) to a File object for FormData upload.
          const urlToFile = async (srcUrl: string, defaultName: string, kind: FileKind): Promise<File> => {
            if (srcUrl.startsWith('data:')) {
              const arr = srcUrl.split(',');
              const mimeMatch = arr[0].match(/:(.*);/);
              if (!mimeMatch) throw new Error('Invalid data URL');
              const mime = mimeMatch[1];
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) u8arr[n] = bstr.charCodeAt(n);
              return new File([u8arr], defaultName, { type: mime });
            }

            // Remote URL – fetch it and build a File object
            const res = await fetch(srcUrl);
            if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
            const blob = await res.blob();
            const ct = blob.type || (kind === 'video' ? 'video/mp4' : 'image/png');
            return new File([blob], defaultName, { type: ct });
          };

          // Helper: upload a single file to R2
          const uploadFile = async (file: File, kind: FileKind): Promise<string> => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('kind', kind);

            const response = await fetch('/api/upload/sign', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Failed to upload ${kind}: ${response.status}`);
            }

            const result = await response.json();
            return result.url;
          };

          // Helper: process all media in a block
          const processBlockMedia = async (block: Block): Promise<Block> => {
            const processedBlock = { ...block };
            
            for (const version of processedBlock.versions) {
              if (version.media) {
                const processedMedia: { kind: FileKind; name: string; src: string }[] = [];
                
                for (const media of version.media) {
                  if (media.src.startsWith('data:') || media.src.startsWith('http')) {
                    const file = await urlToFile(media.src, media.name, media.kind);
                    const uploadedUrl = await uploadFile(file, media.kind);
                    processedMedia.push({ ...media, src: uploadedUrl });
                  } else {
                    processedMedia.push(media);
                  }
                }
                
                version.media = processedMedia;
              }
            }
            
            return processedBlock;
          };

          // Process all blocks in the post
          const processedBlocks = await Promise.all(
            post.blocks.map(processBlockMedia)
          );

          // Update post with processed blocks
          get().updatePost(postId, { blocks: processedBlocks });

          // Publish to all connected pages
          const brand = workspace.brand;
          if (!brand) {
            throw new Error("No brand found for workspace");
          }

          const connectedPages = (workspace.socialPages || []).filter((page: SocialPage) => 
            post.pages.includes(page.id) && page.connected
          );

          if (connectedPages.length === 0) {
            throw new Error("No connected pages found for this post");
          }

          const publishPromises = connectedPages.map(async (page: SocialPage) => {
            const ops = getPlatformOperations(page.platform);
            if (!ops) {
              throw new Error(`Platform operations not found for ${page.platform}`);
            }

            // Prepare base publish options with settings
            let publishOptions: any = { 
              scheduledTime,
              settings: post.settings // Pass the full settings object
            };
            let postContent: any;

            if (['tiktok', 'linkedin', 'facebook', 'instagram', 'google', 'youtube', 'pinterest'].includes(page.platform)) {
              
              // Use TikTok settings if available, otherwise use defaults
              if (post.settings?.tiktok) {
                const tiktokOptions = mapTikTokSettingsToPublishOptions(post.settings.tiktok);
                publishOptions = { ...publishOptions, ...tiktokOptions };
              }
              
              // Use YouTube settings if available, otherwise use defaults
              if (post.settings?.youtube) {
                const { mapYouTubeSettingsToPublishOptions } = await import('@/lib/utils/youtube-settings-mapper');
                const youtubeOptions = mapYouTubeSettingsToPublishOptions(post.settings.youtube);
                publishOptions = { ...publishOptions, ...youtubeOptions };
              }

              // Format content for platform API
              postContent = {
                id: postId,
                text: post.caption.default,
                media: {
                  type: post.format,
                  urls: processedBlocks.flatMap((block: Block) => {
                    // from the version i want to pick the latest one
                    const latestVersion = block.versions.sort((a: Version, b: Version) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                    return [latestVersion.file?.url]
                  })
                }
              };
            } else {
              // Standard content format for other platforms
              postContent = {
                text: post.caption.default,
                media: {
                  type: "image" as const,
                  urls: processedBlocks.flatMap((block: Block) => 
                    block.versions.flatMap((version: Version) => version.media?.map((m: any) => m.src) || [])
                  )
                }
              };
            }

            const publishResult = await ops.publishPost(page, postContent , publishOptions);

            return {
              pageId: page.id,
              result: publishResult
            };
          });

          const results = await Promise.all(publishPromises);
          
          // Update post status based on results
          const hasErrors = results.some((r: any) => r.result.error);
          if (hasErrors) {
            get().updatePost(postId, { status: "Failed Publishing" });
            throw new Error("Some posts failed to publish");
          } else {
            get().updatePost(postId, { status: scheduledTime ? "Scheduled" : "Published" });
          }

          // Add success activity
          if (workspace) {
            await get().addActivity({
              postId,
              workspaceId: workspace.id,
              actorId: (get() as any).user?.id || '',
              type: scheduledTime ? "scheduled" : "published",
              metadata: {
                publishTime: scheduledTime
              }
            });
          }
        },
        {
          loading: scheduledTime ? "Scheduling post..." : "Publishing post...",
          success: scheduledTime ? "Post scheduled successfully!" : "Post published successfully!",
          error: "An error occurred while publishing."
        }
      );
    },

    updatePostStatusesBasedOnTime: () => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const workspaces = workspaceStore.workspaces;
      
      let updatedCount = 0;
      let hasChanges = false;
      
      const newWs = workspaces.map((ws: Workspace) => ({
        ...ws,
        boards: ws.boards.map((board: Board) => {
          const updatedPosts = board.posts.map((p: Post) => {
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

    // Block and version methods
    addBlock: (postId, kind) => {
      const bid = uuidv4();
      const newBlock: Block = {
        id: bid,
        kind,
        currentVersionId: "",
        versions: [],
        comments: []
      };
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      
      // Update workspace store with new block
      const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
        ...ws,
        boards: ws.boards.map((b: Board) => ({
          ...b,
          posts: b.posts.map((p: Post) => {
            if (p.id !== postId) return p;
            return { ...p, blocks: [...p.blocks, newBlock] };
          }),
        })),
      }));
      
      useWorkspaceStore.setState({ workspaces: newWorkspaces });
      return bid;
    },

    removeBlock: (postId, blockId) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      
      // Update workspace store by removing block
      const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
        ...ws,
        boards: ws.boards.map((b: Board) => ({
          ...b,
          posts: b.posts.map((p: Post) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              blocks: p.blocks.filter((b: Block) => b.id !== blockId),
            };
          }),
        })),
      }));
      
      useWorkspaceStore.setState({ workspaces: newWorkspaces });
    },

    addVersion: (postId, blockId, ver) => {
      const newVid = uuidv4();
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      
      // Update workspace store with new version
      const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
        ...ws,
        boards: ws.boards.map((b: Board) => ({
          ...b,
          posts: b.posts.map((p: Post) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              blocks: p.blocks.map((b: Block) => {
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
      }));
      
      useWorkspaceStore.setState({ workspaces: newWorkspaces });
      return newVid;
    },

    setCurrentVersion: (postId, blockId, versionId) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      
      // Update workspace store with new current version
      const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
        ...ws,
        boards: ws.boards.map((b: Board) => ({
          ...b,
          posts: b.posts.map((p: Post) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              blocks: p.blocks.map((b: Block) => 
                b.id === blockId
                  ? { ...b, currentVersionId: versionId }
                  : b
              ),
            };
          }),
        })),
      }));
      
      useWorkspaceStore.setState({ workspaces: newWorkspaces });
    },

    // Comment methods
    addPostComment: async (postId, text, parentId, revisionRequested) => {
      const comment = await commentApi.addPostComment({
        postId: postId,
        text,
        parentId: parentId,
        revisionRequested: revisionRequested,
        author: getCurrentUserDisplayNameFromStore(),
        authorEmail: (get() as any).user?.email,
        authorImageUrl: (get() as any).user?.imageUrl,
      });

      if (revisionRequested) {
        const currentPost = get().getPost(postId);
        if (currentPost) {
          const allowedStatusesForRevision = ["Pending Approval", "Revised", "Approved"];
          if (allowedStatusesForRevision.includes(currentPost.status)) {
            const { useWorkspaceStore } = require('./workspace-store');
            const workspaceStore = useWorkspaceStore.getState();
            
            // Update workspace store with new post status
            const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
              ...ws,
              boards: ws.boards.map((b: Board) => ({
                ...b,
                posts: b.posts.map((p: Post) => (
                  p.id !== postId ? p : { ...p, status: "Needs Revisions" as Status }
                )),
              })),
            }));
            
            useWorkspaceStore.setState({ workspaces: newWorkspaces });
          }
        }
      }

      // Update workspace store with new comment
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      
      const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
        ...ws,
        boards: ws.boards.map((b: Board) => ({
          ...b,
          posts: b.posts.map((p: Post) => {
            if (p.id !== postId) return p;
            const c: BaseComment = {
              id: comment.id,
              parentId: comment.parentId,
              createdAt: new Date(comment.created_at),
              author: comment.author,
              authorEmail: (get() as any).user?.email,
              authorImageUrl: (get() as any).user?.imageUrl,
              text: comment.text,
              revisionRequested: comment.revision_requested,
            };
            return { ...p, comments: [...p.comments, c] };
          }),
        })),
      }));
      
      useWorkspaceStore.setState({ workspaces: newWorkspaces });
      return comment.id;
    },

    addBlockComment: async (postId, blockId, text, parentId, revisionRequested) => {
      const comment = await commentApi.addBlockComment({
        postId: postId,
        blockId: blockId,
        text,
        parentId: parentId,
        revisionRequested: revisionRequested,
        author: getCurrentUserDisplayNameFromStore(),
        authorEmail: (get() as any).user?.email,
        authorImageUrl: (get() as any).user?.imageUrl,
      });

      if (revisionRequested) {
        const currentPost = get().getPost(postId);
        if (currentPost) {
          const allowedStatusesForRevision = ["Pending Approval", "Revised", "Approved"];
          if (allowedStatusesForRevision.includes(currentPost.status)) {
            const { useWorkspaceStore } = require('./workspace-store');
            const workspaceStore = useWorkspaceStore.getState();
            
            // Update workspace store with new post status
            const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
              ...ws,
              boards: ws.boards.map((b: Board) => ({
                ...b,
                posts: b.posts.map((p: Post) => (
                  p.id !== postId ? p : { ...p, status: "Needs Revisions" as Status }
                )),
              })),
            }));
            
            useWorkspaceStore.setState({ workspaces: newWorkspaces });
          }
        }
      }

      // Update workspace store with new comment
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      
      const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
        ...ws,
        boards: ws.boards.map((b: Board) => ({
          ...b,
          posts: b.posts.map((p: Post) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              blocks: p.blocks.map((b: Block) => {
                if (b.id !== blockId) return b;
                const c: BaseComment = {
                  id: comment.id,
                  parentId: comment.parentId,
                  createdAt: new Date(comment.created_at),
                  author: comment.author,
                  authorEmail: (get() as any).user?.email,
                  authorImageUrl: (get() as any).user?.imageUrl,
                  text: comment.text,
                  revisionRequested: comment.revision_requested,
                };
                return { ...b, comments: [...b.comments, c] };
              }),
            };
          }),
        })),
      }));
      
      useWorkspaceStore.setState({ workspaces: newWorkspaces });
      return comment.id;
    },

    addVersionComment: async (
      postId: string,
      blockId: string,
      verId: string,
      text: string,
      rect?: { x: number; y: number; w: number; h: number },
      parentId?: string,
      revisionRequested?: boolean
    ) => {
      const comment = await commentApi.addVersionComment({
        postId: postId,
        blockId: blockId,
        versionId: verId,
        text,
        parentId: parentId,
        revisionRequested: revisionRequested,
        author: getCurrentUserDisplayNameFromStore(),
        authorEmail: (get() as any).user?.email,
        authorImageUrl: (get() as any).user?.imageUrl,
        rect,
      });

      if (revisionRequested) {
        const currentPost = get().getPost(postId);
        if (currentPost) {
          const allowedStatusesForRevision = ["Pending Approval", "Revised", "Approved"];
          if (allowedStatusesForRevision.includes(currentPost.status)) {
            const { useWorkspaceStore } = require('./workspace-store');
            const workspaceStore = useWorkspaceStore.getState();
            
            // Update workspace store with new post status
            const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
              ...ws,
              boards: ws.boards.map((b: Board) => ({
                ...b,
                posts: b.posts.map((p: Post) => (
                  p.id !== postId ? p : { ...p, status: "Needs Revisions" as Status }
                )),
              })),
            }));
            
            useWorkspaceStore.setState({ workspaces: newWorkspaces });
          }
        }
      }

      // Update workspace store with new comment
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      
      const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
        ...ws,
        boards: ws.boards.map((b: Board) => ({
          ...b,
          posts: b.posts.map((p: Post) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              blocks: p.blocks.map((b: Block) => {
                if (b.id !== blockId) return b;
                return {
                  ...b,
                  versions: b.versions.map((v: Version) => {
                    if (v.id !== verId) return v;
                    const c: VersionComment = {
                      id: comment.id,
                      parentId: comment.parentId,
                      createdAt: new Date(comment.created_at),
                      author: comment.author,
                      authorEmail: (get() as any).user?.email,
                      authorImageUrl: (get() as any).user?.imageUrl,
                      text: comment.text,
                      revisionRequested: comment.revision_requested,
                    };
                    if (comment.rect) c.rect = comment.rect;
                    return { ...v, comments: [...v.comments, c] };
                  }),
                };
              })
            };
          }),
        })),
      }));
      
      useWorkspaceStore.setState({ workspaces: newWorkspaces });
      return comment.id;
    },

    // Activity methods
    addActivity: async (act) => {
      const { useWorkspaceStore } = require('./workspace-store');
      const workspaceStore = useWorkspaceStore.getState();
      const workspace = workspaceStore.getActiveWorkspace();
      
      if (!workspace || !act.postId) return;

      try {
        // First, persist to database
        const saved = await activityApi.addActivity({
          workspaceId: workspace.id,
          postId: act.postId,
          actorId: act.actorId,
          type: act.type,
          metadata: act.metadata,
        });

        console.log('saved', saved);

        // Then, update the workspace store with the saved activity
        if (saved && saved.id) {
          const activityId = saved.id as string;
          const newWorkspaces = workspaceStore.workspaces.map((ws: Workspace) => ({
            ...ws,
            boards: ws.boards.map((b: Board) => ({
              ...b,
              posts: b.posts.map((p: Post) => {
                if (p.id !== act.postId) return p;
                return {
                  ...p,
                  activities: [
                    {
                      ...act,
                      id: activityId,
                      actor: saved.actor,
                      createdAt: new Date(saved.created_at),
                      updatedAt: new Date(saved.updated_at),
                    },
                    ...p.activities
                  ],
                };
              }),
            })),
          }));
          
          useWorkspaceStore.setState({ workspaces: newWorkspaces });
        }
      } catch (error) {
        // Handle error - you might want to show a notification or handle it differently
        console.error('Failed to add activity:', error);
        throw error; // Re-throw to let caller handle the error
      }
    },
  })
);