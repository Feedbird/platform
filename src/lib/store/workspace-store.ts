import { createPersistedStore, boardsToNav, defaultIcons, defaultColors } from './store-utils';
import { storeApi } from '@/lib/api/api-service';
import type { 
  Workspace, 
  Brand, 
  Board, 
  BoardTemplate, 
  BoardRules, 
  BoardGroupData, 
  GroupComment, 
  GroupMessage,
  ConditionGroup 
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { NavLink } from './types';

export interface WorkspaceStore {
  // State
  workspaces: Workspace[];
  workspacesLoading: boolean;
  workspacesInitialized: boolean;
  activeWorkspaceId: string | null;
  activeBrandId: string | null;
  activeBoardId: string | null;
  boardTemplates: BoardTemplate[];
  boardNav: NavLink[];

  // Workspace methods
  setActiveWorkspace: (id: string) => void;
  addWorkspace: (name: string, email: string, logo?: string, default_board_rules?: BoardRules) => Promise<string>;
  removeWorkspace: (id: string) => Promise<void>;
  loadUserWorkspaces: (email: string) => Promise<void>;
  getActiveWorkspace: () => Workspace | undefined;

  // Brand methods
  setActiveBrand: (id: string) => void;
  addBrand: (name: string, logo?: string, styleGuide?: Brand['styleGuide'], link?: string, voice?: string, prefs?: string) => Promise<string>;
  updateBrand: (id: string, data: Partial<Brand>) => Promise<void>;
  removeBrand: (id: string) => Promise<void>;
  getActiveBrand: () => Brand | undefined;

  // Board methods
  setActiveBoard: (id: string) => void;
  setBoardFilterConditions: (boardId: string, conditions: ConditionGroup) => void;
  getBoardFilterConditions: (boardId: string) => ConditionGroup | undefined;
  addBoard: (name: string, description?: string, image?: string, color?: string, rules?: BoardRules) => Promise<string>;
  updateBoard: (id: string, data: Partial<Board>) => Promise<void>;
  removeBoard: (id: string) => Promise<void>;

  // Board Templates
  addBoardTemplate: (template: Omit<BoardTemplate, 'id'>) => string;
  updateBoardTemplate: (id: string, data: Partial<BoardTemplate>) => void;
  removeBoardTemplate: (id: string) => void;

  // Group data methods
  addGroupComment: (boardId: string, month: number, text: string, author: string) => string;
  updateGroupComment: (boardId: string, month: number, commentId: string, data: Partial<GroupComment>) => void;
  deleteGroupComment: (boardId: string, month: number, commentId: string) => void;
  resolveGroupComment: (boardId: string, month: number, commentId: string, resolvedBy: string) => void;
  addGroupMessage: (boardId: string, month: number, commentId: string, text: string, author: string, parentMessageId?: string) => string;
  updateGroupMessage: (boardId: string, month: number, commentId: string, messageId: string, data: Partial<GroupMessage>) => void;
  deleteGroupMessage: (boardId: string, month: number, commentId: string, messageId: string) => void;
  updateGroupCommentAiSummary: (boardId: string, month: number, commentId: string, aiSummary: string[]) => void;
  deleteGroupCommentAiSummaryItem: (boardId: string, month: number, commentId: string, summaryIndex: number) => void;
  markGroupCommentRead: (boardId: string, month: number, commentId: string) => void;
}

const defaultBoards: Board[] = [
  { 
    id: "static-posts", 
    name: "Static Posts", 
    image: "/images/boards/static-posts.svg", 
    color: "#125AFF",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: -1,
      ongoingMonth: -1,
      approvalDays: 7,
    },
    createdAt: new Date('2025-01-01'),
    posts: []
  },
  { 
    id: "short-form-videos", 
    name: "Short-Form Videos", 
    image: "/images/boards/short-form-videos.svg", 
    color: "#125AFF",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 3,
      ongoingMonth: 2,
      approvalDays: 7,
    },
    createdAt: new Date('2025-01-01'),
    posts: []
  },
  { 
    id: "email-design", 
    name: "Email Design", 
    image: "/images/boards/email-design.svg", 
    color: "#125AFF",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 3,
      ongoingMonth: 2,
      approvalDays: 7,
    },
    createdAt: new Date('2025-01-01'),
    posts: []
  },
];

const defaultBoardTemplates: BoardTemplate[] = [
  { 
    id: "t1", 
    name: "Social Media Posts", 
    image: "/images/boards/templates/t1-social-media-post.svg", 
    description: "Social Media Posts", 
    color: "#7262F8",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 3,
      ongoingMonth: 2,
      approvalDays: 7,
    }
  },
  { 
    id: "t2", 
    name: "Short-Form Videos", 
    image: "/images/boards/templates/t2-short-form-videos.svg", 
    description: "Short-Form Videos", 
    color: "#45568F",
    rules: {
      autoSchedule: false,
      revisionRules: false,
      approvalDeadline: false,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Small",
    }
  },
  { 
    id: "t3", 
    name: "Email Design", 
    image: "/images/boards/templates/t3-email-design.svg", 
    description: "Email Design", 
    color: "#F56858",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "X-Large",
      firstMonth: 5,
      ongoingMonth: 3,
      approvalDays: 14,
    }
  },
  { 
    id: "t4", 
    name: "Meta Ads Management", 
    image: "/images/boards/templates/t4-meta-ads.svg", 
    description: "Meta Ads Management", 
    color: "#0280F8",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "X-Large",
      firstMonth: 6,
      ongoingMonth: 3,
      approvalDays: 60,
    }
  },
  { 
    id: "t5", 
    name: "Google Ads Management", 
    image: "/images/boards/templates/t5-google-ads.svg", 
    description: "Google Ads Management", 
    color: "#4E9BF8",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "X-Large",
      firstMonth: 6,
      ongoingMonth: 3,
      approvalDays: 60,
    }
  },
  { 
    id: "t6", 
    name: "Video Ads", 
    image: "/images/boards/templates/t6-video-ads.svg", 
    description: "Video Ads", 
    color: "#F97046",
    rules: {
      autoSchedule: false,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "status",
      sortBy: "month",
      rowHeight: "Large",
      firstMonth: 3,
      ongoingMonth: 1,
      approvalDays: 30,
    }
  },
  { 
    id: "t7", 
    name: "Static Ads", 
    image: "/images/boards/templates/t7-static-ads.svg", 
    description: "Static Ads", 
    color: "#3CBCD9",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "XX-Large",
      firstMonth: 5,
      ongoingMonth: 2,
      approvalDays: 14,
    }
  },
  { 
    id: "t8", 
    name: "UGC videos", 
    image: "/images/boards/templates/t8-ugc-videos.svg", 
    description: "UGC videos", 
    color: "#656667",
    rules: {
      autoSchedule: false,
      revisionRules: false,
      approvalDeadline: false,
      groupBy: "status",
      sortBy: "status",
      rowHeight: "Large",
    }
  },
  { 
    id: "t9", 
    name: "SEO Backlinks", 
    image: "/images/boards/templates/t9-seo-backlinks.svg", 
    description: "SEO Backlinks", 
    color: "#5CB3A4",
    rules: {
      autoSchedule: false,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 2,
      ongoingMonth: 1,
      approvalDays: 30,
    }
  },
  { 
    id: "t10", 
    name: "Product Feed Optimization", 
    image: "/images/boards/templates/t10-product-feed-optimization.svg", 
    description: "Product Feed Optimization", 
    color: "#9AC565",
    rules: {
      autoSchedule: false,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 2,
      ongoingMonth: 1,
      approvalDays: 30,
    }
  },
  { 
    id: "t11", 
    name: "Full Email Marketing", 
    image: "/images/boards/templates/t11-full-email-marketing.svg", 
    description: "Full Email Marketing", 
    color: "#6A9DEA",
    rules: {
      autoSchedule: false,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 2,
      ongoingMonth: 1,
      approvalDays: 30,
    }
  },
  { 
    id: "t12", 
    name: "SEO Blog Posts", 
    image: "/images/boards/templates/t12-seo-blog-posts.svg", 
    description: "SEO Blog Posts", 
    color: "#7A7E82",
    rules: {
      autoSchedule: false,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 2,
      ongoingMonth: 1,
      approvalDays: 30,
    }
  },
  { 
    id: "t13", 
    name: "Conversion Tracking Setup", 
    image: "/images/boards/templates/t13-conversion-tracking-setup.svg", 
    description: "Conversion Tracking Setup", 
    color: "#9A9A9A",
    rules: {
      autoSchedule: false,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 2,
      ongoingMonth: 1,
      approvalDays: 30,
    }
  },
  { 
    id: "t14", 
    name: "Instagram Growth", 
    image: "/images/boards/templates/t14-instagram-growth.svg", 
    description: "Instagram Growth", 
    color: "#DF8FFF",
    rules: {
      autoSchedule: false,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 2,
      ongoingMonth: 1,
      approvalDays: 30,
    }
  },
];

export const useWorkspaceStore = createPersistedStore<WorkspaceStore>(
  "workspace-store",
  (set, get) => ({
    // State
    workspaces: [],
    workspacesLoading: false,
    workspacesInitialized: false,
    activeWorkspaceId: null,
    activeBrandId: null,
    activeBoardId: null,
    boardTemplates: defaultBoardTemplates,
    boardNav: [],

    // Workspace methods
    setActiveWorkspace: (id) =>
      set((s) => {
        const ws = s.workspaces.find((w) => w.id === id);
        console.log("activeworkspace:", ws);
        
        // Check if current pathname is a board route and if that board exists in the new workspace
        let newActiveBoardId: string | null = null;
        
        // Try to get the current pathname from window.location if available
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          
          // Handle new workspace-scoped routes: /[workspaceId]/content/[board_id]
          if (pathname.includes('/content/')) {
            const pathParts = pathname.split('/');
            const contentIndex = pathParts.findIndex(part => part === 'content');
            if (contentIndex !== -1 && pathParts[contentIndex + 1]) {
              const currentBoardId = pathParts[contentIndex + 1];
              
              // Check if this board exists in the new workspace
              if (currentBoardId && ws?.boards.some(b => b.id === currentBoardId)) {
                newActiveBoardId = currentBoardId;
              }
            }
          }
          // Handle old routes for backward compatibility: /content/[board_id]
          else if (pathname.startsWith('/content/')) {
            const currentBoardId = pathname.split('/')[2]; // Extract board_id from /content/[board_id]
            
            // Check if this board exists in the new workspace
            if (currentBoardId && ws?.boards.some(b => b.id === currentBoardId)) {
              newActiveBoardId = currentBoardId;
            }
          }
        }
        
        // If no board from pathname or board doesn't exist in new workspace, set to null
        if (!newActiveBoardId) {
          newActiveBoardId = null;
        }
        
        return {
          activeWorkspaceId: id,
          activeBrandId: ws?.brand?.id ?? null,
          activeBoardId: newActiveBoardId,
          boardNav: boardsToNav(ws?.boards ?? [], id),
        };
      }),

    addWorkspace: async (name, email, logo, default_board_rules?) => {
      try {
        const wid = await storeApi.createWorkspaceAndUpdateStore(name, email, logo, default_board_rules)
        return wid
      } catch (error) {
        console.error('Failed to add workspace:', error)
        throw error
      }
    },

    removeWorkspace: async (id) => {
      try {
        await storeApi.deleteWorkspaceAndUpdateStore(id)
      } catch (error) {
        console.error('Failed to remove workspace:', error)
        throw error
      }
    },

    loadUserWorkspaces: async (email) => {
      try {
        await storeApi.loadUserWorkspaces(email)
      } catch (error) {
        console.error('Failed to load user workspaces:', error)
        throw error
      }
    },

    getActiveWorkspace: () => {
      const workspace = get().workspaces.find((w) => w.id === get().activeWorkspaceId);
      if (!workspace) return undefined;
      
      return workspace;
    },

    // Brand methods
    setActiveBrand: (id: string) =>
      set((s) => {
        const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
        const brand = ws?.brand && ws.brand.id === id ? ws.brand : undefined;
        return { activeBrandId: id };
      }),

    addBrand: async (
      name: string,
      logo?: string,
      styleGuide?: Brand['styleGuide'],
      link?: string,
      voice?: string,
      prefs?: string
    ) => {
      try {
        const activeWorkspaceId = get().activeWorkspaceId
        if (!activeWorkspaceId) {
          throw new Error('No active workspace')
        }
        const bid = await storeApi.createBrandAndUpdateStore(
          activeWorkspaceId,
          name,
          logo,
          styleGuide,
          link,
          voice,
          prefs
        )
        return bid
      } catch (error) {
        console.error('Failed to add brand:', error)
        throw error
      }
    },

    updateBrand: async (id, data) => {
      try {
        await storeApi.updateBrandAndUpdateStore(id, data)
      } catch (error) {
        console.error('Failed to update brand:', error)
        throw error
      }
    },

    removeBrand: async (id) => {
      try {
        await storeApi.deleteBrandAndUpdateStore(id)
      } catch (error) {
        console.error('Failed to remove brand:', error)
        throw error
      }
    },

    getActiveBrand: () => {
      const ws = get().getActiveWorkspace();
      return ws?.brand && ws.brand.id === get().activeBrandId ? ws.brand : undefined;
    },

    // Board methods
    setActiveBoard: (id) => set({ activeBoardId: id }),

    setBoardFilterConditions: (boardId, conditions) => {
      set((state) => {
        const workspace = state.workspaces.find(w => w.id === state.activeWorkspaceId);
        if (!workspace) return state;
        
        const board = workspace.boards.find(b => b.id === boardId);
        if (!board) return state;
        
        // Update the board with new filter conditions
        const updatedBoard = { ...board, filterConditions: conditions };
        const updatedBoards = workspace.boards.map(b => b.id === boardId ? updatedBoard : b);
        const updatedWorkspace = { ...workspace, boards: updatedBoards };
        const updatedWorkspaces = state.workspaces.map(w => w.id === workspace.id ? updatedWorkspace : w);
        
        return { workspaces: updatedWorkspaces };
      });
    },

    getBoardFilterConditions: (boardId) => {
      const state = get();
      const workspace = state.workspaces.find(w => w.id === state.activeWorkspaceId);
      if (!workspace) return undefined;
      
      const board = workspace.boards.find(b => b.id === boardId);
      return board?.filterConditions;
    },

    addBoard: async (name: string, description?: string, image?: string, color?: string, rules?: BoardRules) => {
      try {
        const activeWorkspaceId = get().activeWorkspaceId
        if (!activeWorkspaceId) {
          throw new Error('No active workspace')
        }
        const bid = await storeApi.createBoardAndUpdateStore(
          activeWorkspaceId,
          name,
          description,
          !image ? '/images/boards/templates/t0-blank.svg' : image,
          color,
          rules
        )
        set({ activeBoardId: bid })
        return bid
      } catch (error) {
        console.error('Failed to add board:', error)
        throw error
      }
    },

    updateBoard: async (id: string, data: Partial<Board>) => {
      try {
        await storeApi.updateBoardAndUpdateStore(id, data)
      } catch (error) {
        console.error('Failed to update board:', error)
        throw error
      }
    },

    removeBoard: async (id: string) => {
      try {
        await storeApi.deleteBoardAndUpdateStore(id)
      } catch (error) {
        console.error('Failed to remove board:', error)
        throw error
      }
    },

    // Board Templates
    addBoardTemplate: (template) => {
      const tid = uuidv4();
      const newTemplate: BoardTemplate = { ...template, id: tid };
      set(s => ({ boardTemplates: [...s.boardTemplates, newTemplate] }));
      return tid;
    },

    updateBoardTemplate: (id, data) => {
      set(s => ({
        boardTemplates: s.boardTemplates.map(t => t.id === id ? { ...t, ...data } : t)
      }));
    },

    removeBoardTemplate: (id) => {
      set(s => ({
        boardTemplates: s.boardTemplates.filter(t => t.id !== id)
      }));
    },

    // Group data methods implementation (DB first)
    addGroupComment: (boardId, month, text, author) => {
      const commentId = uuidv4();
      const userEmail: string | null = (get() as any).user?.email ?? null;
      // Optimistic local object to use in case of failure
      const optimisticComment: GroupComment = {
        id: commentId,
        author,
        authorEmail: userEmail || undefined,
        authorImageUrl: (get() as any).user?.imageUrl,
        text,
        createdAt: new Date(),
        resolved: false,
        messages: [],
        readBy: userEmail ? [userEmail] : [],
        aiSummary: [
          "Love the overall vibe, but the first 3 seconds felt a bit slow to grab attention.",
          "Typography is nice but hard to read on mobile due to size.",
          "Maybe reduce the pink saturation slightly—it's overpowering the visuals."
        ]
      };

      // Persist to DB by updating board.group_data, then sync store from server response
      const st = get();
      const ws = st.getActiveWorkspace();
      if (!ws) return commentId;

      const currentBoard = ws.boards.find(b => b.id === boardId);
      const currentGroupData = currentBoard?.groupData || [];
      const nextGroupData: BoardGroupData[] = (() => {
        const monthGroup = currentGroupData.find(gd => gd.month === month);
        if (monthGroup) {
          return currentGroupData.map(gd => gd.month === month ? {
            ...gd,
            comments: [...gd.comments, optimisticComment]
          } : gd);
        }
        return [...currentGroupData, { month, comments: [optimisticComment], revisionCount: 0 }];
      })();

      // DB first: update board.group_data, which will then update the store via storeApi
      storeApi.updateBoardAndUpdateStore(boardId, { group_data: nextGroupData });
      return commentId;
    },

    /** Mark a specific group comment as read by current user (adds email to readBy). DB-first */
    markGroupCommentRead: (boardId: string, month: number, commentId: string) => {
      const st = get();
      const ws = st.getActiveWorkspace();
      if (!ws) return;
      const currentBoard = ws.boards.find(b => b.id === boardId);
      const currentGroupData = currentBoard?.groupData || [];
      const userEmail: string | null = (get() as any).user?.email ?? null;
      if (!userEmail) return;

      const nextGroupData = currentGroupData.map(gd => {
        if (gd.month !== month) return gd;
        return {
          ...gd,
          comments: gd.comments.map(c => c.id === commentId
            ? { ...c, readBy: Array.from(new Set([...(c.readBy || []), userEmail])) }
            : c)
        };
      });
      storeApi.updateBoardAndUpdateStore(boardId, { group_data: nextGroupData });
    },

    updateGroupComment: (boardId, month, commentId, data) => {
      set((s) => ({
        workspaces: s.workspaces.map((ws) => {
          // Only update the active workspace
          if (ws.id !== s.activeWorkspaceId) return ws;
          
          return {
            ...ws,
            boards: ws.boards.map((board) => {
              if (board.id !== boardId) return board;
              
              const updatedGroupData = (board.groupData || []).map(gd => {
                if (gd.month !== month) return gd;
                
                return {
                  ...gd,
                  comments: gd.comments.map(comment => 
                    comment.id === commentId 
                      ? { ...comment, ...data, updatedAt: new Date() }
                      : comment
                  )
                };
              });
              
              return { ...board, groupData: updatedGroupData };
            })
          };
        })
      }));
    },

    deleteGroupComment: (boardId, month, commentId) => {
      set((s) => ({
        workspaces: s.workspaces.map((ws) => {
          // Only update the active workspace
          if (ws.id !== s.activeWorkspaceId) return ws;
          
          return {
            ...ws,
            boards: ws.boards.map((board) => {
              if (board.id !== boardId) return board;
              
              const updatedGroupData = (board.groupData || []).map(gd => {
                if (gd.month !== month) return gd;
                
                return {
                  ...gd,
                  comments: gd.comments.filter(comment => comment.id !== commentId)
                };
              });
              
              return { ...board, groupData: updatedGroupData };
            })
          };
        })
      }));
    },

    resolveGroupComment: (boardId, month, commentId, resolvedBy) => {
      const st = get();
      const ws = st.getActiveWorkspace();
      if (!ws) return;
      const currentBoard = ws.boards.find(b => b.id === boardId);
      const currentGroupData = currentBoard?.groupData || [];
      const nextGroupData = currentGroupData.map(gd => {
        if (gd.month !== month) return gd;
        return {
          ...gd,
          comments: gd.comments.map(c => c.id === commentId ? {
            ...c,
            resolved: true,
            resolvedAt: new Date(),
            resolvedBy,
            updatedAt: new Date(),
          } : c)
        };
      });
      storeApi.updateBoardAndUpdateStore(boardId, { group_data: nextGroupData });
    },

    addGroupMessage: (boardId, month, commentId, text, author, parentMessageId) => {
      const messageId = uuidv4();
      const newMessage: GroupMessage = {
        id: messageId,
        author,
        authorEmail: (get() as any).user?.email,
        authorImageUrl: (get() as any).user?.imageUrl,
        text,
        createdAt: new Date(),
        replies: []
      };

      const st = get();
      const ws = st.getActiveWorkspace();
      if (!ws) return messageId;

      const currentBoard = ws.boards.find(b => b.id === boardId);
      const currentGroupData = currentBoard?.groupData || [];
      const nextGroupData = currentGroupData.map(gd => {
        if (gd.month !== month) return gd;
        return {
          ...gd,
          comments: gd.comments.map(comment => {
            if (comment.id !== commentId) return comment;
            if (!parentMessageId) {
              return { ...comment, messages: [...comment.messages, newMessage] };
            }
            const addToReplies = (messages: GroupMessage[]): GroupMessage[] => {
              return messages.map(msg => msg.id === parentMessageId
                ? { ...msg, replies: [...msg.replies, newMessage] }
                : { ...msg, replies: addToReplies(msg.replies) }
              );
            };
            return { ...comment, messages: addToReplies(comment.messages) };
          })
        };
      });
      storeApi.updateBoardAndUpdateStore(boardId, { group_data: nextGroupData });
      return messageId;
    },

    updateGroupMessage: (boardId, month, commentId, messageId, data) => {
      set((s) => ({
        workspaces: s.workspaces.map((ws) => {
          // Only update the active workspace
          if (ws.id !== s.activeWorkspaceId) return ws;
          
          return {
            ...ws,
            boards: ws.boards.map((board) => {
              if (board.id !== boardId) return board;
              
              const updatedGroupData = (board.groupData || []).map(gd => {
                if (gd.month !== month) return gd;
                
                const updateMessageInReplies = (messages: GroupMessage[]): GroupMessage[] => {
                  return messages.map(msg => {
                    if (msg.id === messageId) {
                      return { ...msg, ...data, updatedAt: new Date() };
                    } else {
                      return { ...msg, replies: updateMessageInReplies(msg.replies) };
                    }
                  });
                };
                
                return {
                  ...gd,
                  comments: gd.comments.map(comment => {
                    if (comment.id !== commentId) return comment;
                    
                    return {
                      ...comment,
                      messages: updateMessageInReplies(comment.messages)
                    };
                  })
                };
              });
              
              return { ...board, groupData: updatedGroupData };
            })
          };
        })
      }));
    },

    deleteGroupMessage: (boardId, month, commentId, messageId) => {
      set((s) => ({
        workspaces: s.workspaces.map((ws) => {
          // Only update the active workspace
          if (ws.id !== s.activeWorkspaceId) return ws;
          
          return {
            ...ws,
            boards: ws.boards.map((board) => {
              if (board.id !== boardId) return board;
              
              const updatedGroupData = (board.groupData || []).map(gd => {
                if (gd.month !== month) return gd;
                
                const deleteMessageFromReplies = (messages: GroupMessage[]): GroupMessage[] => {
                  return messages
                    .filter(msg => msg.id !== messageId)
                    .map(msg => ({
                      ...msg,
                      replies: deleteMessageFromReplies(msg.replies)
                    }));
                };
                
                return {
                  ...gd,
                  comments: gd.comments.map(comment => {
                    if (comment.id !== commentId) return comment;
                    
                    return {
                      ...comment,
                      messages: deleteMessageFromReplies(comment.messages)
                    };
                  })
                };
              });
              
              return { ...board, groupData: updatedGroupData };
            })
          };
        })
      }));
    },

    updateGroupCommentAiSummary: (boardId, month, commentId, aiSummary) => {
      set((s) => ({
        workspaces: s.workspaces.map((ws) => {
          // Only update the active workspace
          if (ws.id !== s.activeWorkspaceId) return ws;
          
          return {
            ...ws,
            boards: ws.boards.map((board) => {
              if (board.id !== boardId) return board;
              
              const updatedGroupData = (board.groupData || []).map(gd => {
                if (gd.month !== month) return gd;
                
                return {
                  ...gd,
                  comments: gd.comments.map(comment => 
                    comment.id === commentId 
                      ? { ...comment, aiSummary, updatedAt: new Date() }
                      : comment
                  )
                };
              });
              
              return { ...board, groupData: updatedGroupData };
            })
          };
        })
      }));
    },

    deleteGroupCommentAiSummaryItem: (boardId, month, commentId, summaryIndex) => {
      set((s) => ({
        workspaces: s.workspaces.map((ws) => {
          if (ws.id !== s.activeWorkspaceId) return ws;
    
          return {
            ...ws,
            boards: ws.boards.map((board) => {
              if (board.id !== boardId) return board;
    
              const updatedGroupData = (board.groupData || []).map((gd) => {
                if (gd.month !== month) return gd;
    
                return {
                  ...gd,
                  comments: gd.comments.map((comment) => {
                    if (comment.id === commentId && comment.aiSummary) {
                      const newAiSummary = [...comment.aiSummary];
                      newAiSummary.splice(summaryIndex, 1);
                      return { ...comment, aiSummary: newAiSummary, updatedAt: new Date() };
                    }
                    return comment;
                  }),
                };
              });
    
              return { ...board, groupData: updatedGroupData };
            }),
          };
        }),
      }));
    },
  })
);
