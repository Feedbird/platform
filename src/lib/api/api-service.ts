import { TableForm } from '@/components/forms/content/forms-table';
import { CanvasFormField } from '@/components/forms/form-canvas';
import {
  SocialPage,
  useMessageStore,
  useUserStore,
  useWorkspaceStore,
} from '@/lib/store';
import {
  Coupon,
  FormField,
  ServiceFolder,
  User,
  Workspace,
  Brand,
  Board,
  Post,
  Channel,
  ChannelMessage,
  Form,
  Service,
  FormSubmission,
  SocialAccount,
} from '@/lib/store/types';
import {
  ApiResponse,
  ApiError,
  InviteResponse,
  UpdateUserPayload,
  CreateUserPayload,
} from './api-types';

// Normalize activities from API/DB into store Activity shape
function normalizeActivities(items: any[] | undefined) {
  return (items || []).map((a: any) => {
    const created = a.created_at;
    const postId = a.post_id;
    return {
      id: a.id,
      postId,
      actor: a.actor,
      action: a.type, // Map type to action for backward compatibility
      type: a.type,
      createdAt: created instanceof Date ? created : new Date(created),
      metadata: a.metadata,
    } as any;
  });
}

// API Base URL
const API_BASE = '/api';

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  // Attempt to attach Clerk session token on the client if available
  let authHeader: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      const maybeClerk: any = (window as any).Clerk;
      const token: string | undefined = await maybeClerk?.session?.getToken?.();
      if (token && !('Authorization' in (options.headers || ({} as any)))) {
        authHeader = { Authorization: `Bearer ${token}` };
      }
    } catch {
      // no-op; continue without Authorization header
    }
  }

  const response = await fetch(url, {
    // Ensure auth cookies are sent to API routes
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData.details
    );
  }

  return response.json();
}

// User API functions
export const userApi = {
  // Get user by ID or email
  getUser: async (params: { id?: string; email?: string }): Promise<User> => {
    const searchParams = new URLSearchParams();
    if (params.id) searchParams.append('id', params.id);
    if (params.email) searchParams.append('email', params.email);
    return apiRequest(`/user?${searchParams.toString()}`);
  },

  // Create new user
  createUser: async (userData: CreateUserPayload): Promise<User> => {
    return apiRequest<User>('/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Update user
  updateUser: async (
    params: { id?: string; email?: string },
    updates: UpdateUserPayload
  ): Promise<User> => {
    const searchParams = new URLSearchParams();
    if (params.id) searchParams.append('id', params.id);
    if (params.email) searchParams.append('email', params.email);
    return apiRequest<User>(`/user?${searchParams.toString()}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Update notification settings for a specific workspace
  updateNotificationSettings: async (
    userEmail: string,
    settings: {
      communication: {
        commentsAndMentions: boolean;
      };
      boards: {
        pendingApproval: boolean;
        scheduled: boolean;
        published: boolean;
        boardInviteSent: boolean;
        boardInviteAccepted: boolean;
      };
      workspaces: {
        workspaceInviteSent: boolean;
        workspaceInviteAccepted: boolean;
      };
    }
  ): Promise<User> => {
    return apiRequest<User>('/user/notification-settings', {
      method: 'POST',
      body: JSON.stringify({
        user_email: userEmail,
        settings,
      }),
    });
  },

  // Delete user
  deleteUser: async (params: {
    id?: string;
    email?: string;
  }): Promise<{ message: string }> => {
    const searchParams = new URLSearchParams();
    if (params.id) searchParams.append('id', params.id);
    if (params.email) searchParams.append('email', params.email);

    return apiRequest<{ message: string }>(`/user?${searchParams.toString()}`, {
      method: 'DELETE',
    });
  },

  addUnreadMessage: async (
    email: string,
    messageId: string
  ): Promise<{ unreadMsg: string[] }> => {
    const response = await apiRequest<{ unreadMsg: string[] }>(
      '/user/unread-messages',
      {
        method: 'POST',
        body: JSON.stringify({ email, messageId: messageId, action: 'add' }),
      }
    );

    // Update the store after successful API request
    useUserStore.setState((prev: any) => ({
      user: prev.user
        ? {
            ...prev.user,
            unreadMsg: response.unreadMsg,
          }
        : null,
    }));

    return response;
  },

  removeUnreadMessage: async (
    email: string,
    messageId: string
  ): Promise<{ unreadMsg: string[] }> => {
    const response = await apiRequest<{ unreadMsg: string[] }>(
      '/user/unread-messages',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          messageId: messageId,
          action: 'remove',
        }),
      }
    );

    // Update the store after successful API request
    useUserStore.setState((prev: any) => ({
      user: prev.user
        ? {
            ...prev.user,
            unreadMsg: response.unreadMsg,
          }
        : null,
    }));

    return response;
  },
};
// Workspace helper endpoints
export const workspaceHelperApi = {
  // Get members + creator profiles for a workspace
  getWorkspaceMembers: async (
    workspaceId: string
  ): Promise<{
    users: {
      email: string;
      firstName?: string;
      imageUrl?: string;
      role?: 'admin' | 'client' | 'team';
      accept?: boolean;
    }[];
  }> => {
    const searchParams = new URLSearchParams();
    searchParams.append('workspace_id', workspaceId);
    return apiRequest<{
      users: {
        email: string;
        firstName?: string;
        imageUrl?: string;
        role?: 'admin' | 'client' | 'team';
        accept?: boolean;
      }[];
    }>(`/workspace/members?${searchParams.toString()}`);
  },
  // Update a member's role within a workspace
  updateWorkspaceMemberRole: async (
    workspaceId: string,
    email: string,
    role: 'client' | 'team'
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/workspace/members`, {
      method: 'PATCH',
      body: JSON.stringify({ workspaceId, email, role }),
    });
  },
};

export const formsApi = {
  // Create new empty form
  createInitialForm: async (creatorEmail: string, workspaceId: string) => {
    return apiRequest<Form>('/forms/initial', {
      method: 'POST',
      body: JSON.stringify({
        type: 'intake',
        workspaceId: workspaceId,
        title: 'Untitled form',
        createdBy: creatorEmail,
        locationTags: [],
        accountTags: [],
      }),
    });
  },
  getFormById: async (id: string) => {
    return apiRequest<{ data: Form }>(`/forms/${id}`);
  },
  getFormsByWorkspaceId: async (workspaceId: string) => {
    return apiRequest<ApiResponse<Form[]>>(
      `/forms?workspace_id=${workspaceId}`
    );
  },
  // Delete form
  deleteForm: async (id: string) => {
    return apiRequest<{ message: string }>(`/forms/${id}`, {
      method: 'DELETE',
    });
  },
  updateForm: async (
    id: string,
    updates: Partial<TableForm>
  ): Promise<ApiResponse<TableForm>> => {
    return apiRequest<{ data: TableForm }>(`/forms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  getFormFields: async (formId: string) => {
    return apiRequest<{ formFields: CanvasFormField[] }>(
      `/forms/fields?formId=${formId}`
    );
  },
  updateFormFields: async (formId: string, fields: CanvasFormField[]) => {
    return apiRequest<{ message: string }>(`/forms/fields`, {
      method: 'POST',
      body: JSON.stringify({ formId, formFields: fields }),
    });
  },
  submitForm: async ({
    formId,
    workspaceId,
    email,
    submissions,
    schema,
  }: {
    formId: string;
    workspaceId: string;
    email: string;
    submissions: Record<string, any>;
    schema: Record<string, string>;
  }) => {
    return apiRequest<{ data: any }>(`/forms/submission`, {
      method: 'POST',
      body: JSON.stringify({
        formId,
        email,
        workspaceId,
        answers: submissions,
        snapshot: schema,
      }),
    });
  },
  duplicateForm: async (formId: string): Promise<ApiResponse<Form>> => {
    return apiRequest<ApiResponse<Form>>(`/forms/${formId}`, {
      method: 'POST',
    });
  },

  // Submissions
  getFormSubmissions: async (
    formId: string
  ): Promise<ApiResponse<FormSubmission[]>> => {
    return apiRequest<ApiResponse<FormSubmission[]>>(
      `/forms/submission?formId=${formId}`
    );
  },
  getSubmissionById: async (submissionId: string) => {
    return apiRequest<ApiResponse<FormSubmission>>(
      `/forms/submission/${submissionId}`
    );
  },
};

export const servicesApi = {
  fetchAllServices: async (workspaceId: string) => {
    return apiRequest<ApiResponse<Service[]>>(
      '/services' + '?workspaceId=' + workspaceId
    );
  },
  fetchServiceFolders: async (workspaceId: string) => {
    const { data } = await apiRequest<ApiResponse<ServiceFolder[]>>(
      '/services/folders' + '?workspaceId=' + workspaceId
    );

    return data.sort((a, b) => a.order - b.order);
  },
  createDraftService: async (workspaceId: string) => {
    return apiRequest<ApiResponse<string>>('/services', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    });
  },
};

// Slack OAuth/Status API
export const slackApi = {
  getStatus: async (
    workspaceId: string
  ): Promise<{
    connected: boolean;
    channelId?: string | null;
    channelName?: string | null;
    teamId?: string | null;
    teamName?: string | null;
    events?: string[] | null;
  }> => {
    return apiRequest(
      `/oauth/slack/status?workspaceId=${encodeURIComponent(workspaceId)}`
    );
  },
};

// Workspace API functions
export const workspaceApi = {
  // Get workspace by ID or list all
  getWorkspace: async (id?: string): Promise<Workspace | Workspace[]> => {
    const endpoint = id ? `/workspace?id=${id}` : '/workspace';
    return apiRequest<Workspace | Workspace[]>(endpoint);
  },

  // Get workspaces (created + invited) for a specific user
  getWorkspacesByCreator: async (email: string): Promise<Workspace[]> => {
    const endpoint = `/workspace?email=${encodeURIComponent(email)}`;
    return apiRequest<Workspace[]>(endpoint);
  },

  // Create new workspace
  createWorkspace: async (
    workspaceData: {
      name: string;
      logo?: string;
      email: string;
      defaultBoardRules?: Record<string, any>;
      timezone?: string;
      weekStart?: 'monday' | 'sunday';
      timeFormat?: '24h' | '12h';
      allowedPostingTime?: Record<string, any>;
    },
    authToken?: string
  ): Promise<Workspace> => {
    console.log('workspaceData', workspaceData);
    return apiRequest<Workspace>('/workspace', {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      body: JSON.stringify(workspaceData),
    });
  },

  // Update workspace
  updateWorkspace: async (
    id: string,
    updates: {
      name?: string;
      logo?: string;
      timezone?: string;
      weekStart?: 'monday' | 'sunday';
      timeFormat?: '24h' | '12h';
      allowedPostingTime?: Record<string, any>;
      defaultBoardRules?: Record<string, any>;
    }
  ): Promise<Workspace> => {
    return apiRequest<Workspace>(`/workspace?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete workspace
  deleteWorkspace: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/workspace?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Brand API functions
export const brandApi = {
  // Get brand by ID or by workspace (now returns single brand)
  getBrand: async (params: {
    id?: string;
    workspaceId?: string;
    includeSocial?: boolean;
  }): Promise<Brand | null> => {
    const searchParams = new URLSearchParams();
    if (params.id) searchParams.append('id', params.id);
    if (params.workspaceId)
      searchParams.append('workspace_id', params.workspaceId);
    if (params.includeSocial) searchParams.append('include_social', 'true');

    return apiRequest<Brand | null>(`/brand?${searchParams.toString()}`);
  },

  // Create new brand
  createBrand: async (brandData: {
    workspaceId: string;
    name: string;
    logo?: string;
    styleGuide?: any;
    link?: string;
    voice?: string;
    prefs?: string;
  }): Promise<Brand> => {
    return apiRequest<Brand>('/brand', {
      method: 'POST',
      body: JSON.stringify(brandData),
    });
  },

  // Update brand
  updateBrand: async (
    id: string,
    updates: {
      name?: string;
      logo?: string;
      styleGuide?: any;
      link?: string;
      voice?: string;
      prefs?: string;
    }
  ): Promise<Brand> => {
    return apiRequest<Brand>(`/brand?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete brand
  deleteBrand: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/brand?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Board API functions
export const boardApi = {
  // Get board by ID or list by workspace
  getBoard: async (params: {
    id?: string;
    workspaceId?: string;
  }): Promise<Board | Board[]> => {
    const searchParams = new URLSearchParams();
    if (params.id) searchParams.append('id', params.id);
    if (params.workspaceId)
      searchParams.append('workspace_id', params.workspaceId);

    return apiRequest<Board | Board[]>(`/board?${searchParams.toString()}`);
  },

  // Create new board
  createBoard: async (boardData: {
    workspaceId: string;
    name: string;
    image?: string;
    description?: string;
    color?: string;
    rules?: any;
    columns?: Array<{
      name: string;
      isDefault: boolean;
      order: number;
      type?: string;
      options?: any;
    }>;
  }): Promise<Board> => {
    return apiRequest<Board>('/board', {
      method: 'POST',
      body: JSON.stringify(boardData),
    });
  },

  // Update board
  updateBoard: async (
    id: string,
    updates: {
      name?: string;
      image?: string;
      selectedImage?: string;
      description?: string;
      color?: string;
      rules?: any;
      groupData?: any;
      columns?: Array<{
        name: string;
        isDefault: boolean;
        order: number;
        type?: string;
        options?: any;
      }>;
    }
  ): Promise<Board> => {
    return apiRequest<Board>(`/board?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete board
  deleteBoard: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/board?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Channel API functions
export const channelApi = {
  // Get channel by ID or list by workspace
  getChannel: async (params: {
    id?: string;
    workspaceId?: string;
  }): Promise<Channel | Channel[]> => {
    const searchParams = new URLSearchParams();
    if (params.id) searchParams.append('id', params.id);
    if (params.workspaceId)
      searchParams.append('workspace_id', params.workspaceId);
    return apiRequest<Channel | Channel[]>(
      `/channel?${searchParams.toString()}`
    );
  },

  // Create new channel
  createChannel: async (channelData: {
    workspaceId: string;
    createdBy: string;
    name: string;
    description?: string;
    members?: string[];
    icon?: string;
    color?: string;
  }): Promise<Channel> => {
    return apiRequest<Channel>('/channel', {
      method: 'POST',
      body: JSON.stringify(channelData),
    });
  },

  // Update channel
  updateChannel: async (
    id: string,
    updates: {
      name?: string;
      description?: string;
      members?: any;
      icon?: string;
      color?: string;
    }
  ): Promise<Channel> => {
    return apiRequest<Channel>(`/channel?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete channel
  deleteChannel: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/channel?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Channel Message API functions
export const channelMessageApi = {
  // Get message by ID or list by channel/workspace
  getChannelMessage: async (params: {
    id?: string;
    channelId?: string;
    workspaceId?: string;
  }): Promise<
    | (ChannelMessage & { authorName?: string; authorImageUrl?: string })
    | Array<ChannelMessage & { authorName?: string; authorImageUrl?: string }>
  > => {
    const searchParams = new URLSearchParams();
    if (params.id) searchParams.append('id', params.id);
    if (params.channelId) searchParams.append('channel_id', params.channelId);
    if (params.workspaceId)
      searchParams.append('workspace_id', params.workspaceId);
    return apiRequest(`/channel-message?${searchParams.toString()}`);
  },

  // Create new channel message
  createChannelMessage: async (messageData: {
    workspaceId: string;
    channelId: string;
    content: string;
    parentId?: string | null;
    addon?: any;
    readby?: any;
    authorEmail: string;
    emoticons?: any;
  }): Promise<ChannelMessage> => {
    return apiRequest<ChannelMessage>('/channel-message', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  // Update channel message
  updateChannelMessage: async (
    id: string,
    updates: {
      content?: string;
      addon?: any;
      readby?: any;
      emoticons?: any;
    }
  ): Promise<ChannelMessage> => {
    return apiRequest<ChannelMessage>(`/channel-message?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete channel message
  deleteChannelMessage: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/channel-message?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Post API functions
export const postApi = {
  // Get post by ID or list by workspace/board
  getPost: async (params: {
    id?: string;
    workspaceId?: string;
    boardId?: string;
  }): Promise<Post | Post[]> => {
    const searchParams = new URLSearchParams();
    if (params.id) searchParams.append('id', params.id);
    if (params.workspaceId)
      searchParams.append('workspace_id', params.workspaceId);
    if (params.boardId) searchParams.append('board_id', params.boardId);

    return apiRequest<Post | Post[]>(`/post?${searchParams.toString()}`);
  },

  // Create new post
  createPost: async (postData: {
    workspaceId: string;
    boardId: string;
    caption: any;
    status: string;
    format: string;
    publishDate?: string;
    platforms?: string[];
    pages?: string[];
    billingMonth?: string;
    month?: number;
    settings?: any;
    hashtags?: any;
    blocks?: any[];
    comments?: any[];
    activities?: any[];
    userColumns?: Array<{ id: string; value: string }>;
    createdBy: string;
    lastUpdatedBy: string;
  }): Promise<Post> => {
    console.log('postData', postData);
    return apiRequest<Post>('/post', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  // Update post
  updatePost: async (
    id: string,
    updates: {
      caption?: any;
      status?: string;
      format?: string;
      publishDate?: string;
      platforms?: string[];
      pages?: string[];
      billingMonth?: string;
      month?: number;
      settings?: any;
      hashtags?: any;
      blocks?: any[];
      comments?: any[];
      activities?: any[];
      userColumns?: Array<{ id: string; value: string }>;
      lastUpdatedBy?: string;
    }
  ): Promise<Post> => {
    return apiRequest<Post>(`/post?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete post
  deletePost: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/post?id=${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk create posts
  bulkCreatePosts: async (
    posts: {
      workspaceId: string;
      boardId: string;
      caption: any;
      status: string;
      format: string;
      publishDate?: string;
      platforms?: string[];
      pages?: string[];
      billingMonth?: string;
      month?: number;
      settings?: any;
      hashtags?: any;
      blocks?: any[];
      comments?: any[];
      activities?: any[];
      userColumns?: Array<{ id: string; value: string }>;
      createdBy: string;
      lastUpdatedBy: string;
    }[]
  ): Promise<{ message: string; posts: Post[] }> => {
    return apiRequest<{ message: string; posts: Post[] }>('/post/bulk', {
      method: 'POST',
      body: JSON.stringify({ posts }),
    });
  },

  // Bulk delete posts
  bulkDeletePosts: async (
    postIds: string[]
  ): Promise<{ message: string; deletedPosts: Post[] }> => {
    return apiRequest<{ message: string; deletedPosts: Post[] }>('/post/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ postIds: postIds }),
    });
  },

  // Auto-schedule post (server computes publish_date)
  autoSchedule: async (postId: string, status: string): Promise<Post> => {
    return apiRequest<Post>('/post/auto-schedule', {
      method: 'POST',
      body: JSON.stringify({ postId: postId, status: status }),
    });
  },
};

// Zustand store integration functions
export const storeApi = {
  // Load workspaces for current user
  loadUserWorkspaces: async (email: string) => {
    try {
      // mark loading in store
      useWorkspaceStore.setState({ workspacesLoading: true });

      if (!email) {
        console.warn('No email provided for loading workspaces');
        useWorkspaceStore.setState({
          workspaces: [],
          workspacesLoading: false,
          workspacesInitialized: true,
        });
        return [];
      }

      const workspaces = await workspaceApi.getWorkspacesByCreator(email);
      const workspaceStore = useWorkspaceStore.getState();

      if (!workspaces || workspaces.length === 0) {
        console.warn('No workspaces found for user:', email);
        useWorkspaceStore.setState({
          workspaces: [],
          workspacesLoading: false,
          workspacesInitialized: true,
        });
        return [];
      }

      // Transform workspaces - boards are already included from the API
      const transformedWorkspaces = workspaces.map((ws) => {
        // Transform boards that came with the workspace
        const boards = (ws.boards || []).map((b: Board) => ({
          id: b.id,
          name: b.name,
          image: b.image,
          selectedImage: b.selectedImage,
          description: b.description,
          color: b.color,
          rules: b.rules,
          columns: (b as any).columns,
          createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
          groupData: (b as any).group_data || [],
        }));

        return {
          id: ws.id,
          name: ws.name,
          logo: ws.logo,
          defaultBoardRules: (ws as any).default_board_rules,
          timezone: (ws as any).timezone,
          weekStart: (ws as any).week_start,
          timeFormat: (ws as any).time_format,
          allowedPostingTime: (ws as any).allowed_posting_time,
          role: ws.role, // Include the role from API
          boards,
          brand: undefined, // Will be populated below
          // Map workspace.social_accounts (from API) to client shape
          socialAccounts: ((ws as any).social_accounts || []).map(
            (acc: any) => ({
              id: acc.id,
              platform: acc.platform,
              name: acc.name,
              accountId: acc.account_id,
              connected: acc.connected,
              status: acc.status,
              socialPages: (acc.social_pages || []).map((p: SocialPage) => ({
                id: p.id,
                platform: p.platform,
                entityType: p.entityType || 'page',
                name: p.name,
                pageId: p.pageId,
                connected: p.connected,
                status: p.status,
                accountId: acc.id,
                statusUpdatedAt: p.statusUpdatedAt
                  ? new Date(p.statusUpdatedAt)
                  : undefined,
                lastSyncAt: p.lastSyncAt ? new Date(p.lastSyncAt) : undefined,
                followerCount: p.followerCount,
                postCount: p.postCount,
                metadata: p.metadata,
              })),
            })
          ),
          socialPages: ((ws as any).social_accounts || [])
            .flatMap((acc: any) => acc.social_pages || [])
            .map((p: any) => ({
              id: p.id,
              platform: p.platform,
              entityType: p.entity_type || 'page',
              name: p.name,
              pageId: p.page_id,
              connected: p.connected,
              status: p.status,
              accountId: p.account_id,
              socialSetId: (p as any).social_set_id,
              statusUpdatedAt: p.status_updated_at
                ? new Date(p.status_updated_at)
                : undefined,
              lastSyncAt: p.last_sync_at ? new Date(p.last_sync_at) : undefined,
              followerCount: p.follower_count,
              postCount: p.post_count,
              metadata: p.metadata,
            })),
          socialSets: ((ws as any).social_sets || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            workspaceId: s.workspace_id,
            createdAt: s.created_at ? new Date(s.created_at) : undefined,
            updatedAt: s.updated_at ? new Date(s.updated_at) : undefined,
          })),
        };
      });

      // Fetch brand and posts for each workspace (socials already included with workspace)
      const workspacesWithBrands = await Promise.all(
        transformedWorkspaces.map(async (ws) => {
          let brand = null;
          try {
            const brandResp = await brandApi.getBrand({
              workspaceId: ws.id,
              includeSocial: false, // Social data is now at workspace level
            });
            brand = brandResp || null;
          } catch (error) {
            console.warn(`Failed to load brand for workspace ${ws.id}:`, error);
            // Continue without brand data
          }

          // Load channels for this workspace and transform to store shape
          let channels: any[] = [];
          try {
            const channelsResp = await channelApi.getChannel({
              workspaceId: ws.id,
            });
            const channelsDb = Array.isArray(channelsResp)
              ? channelsResp
              : channelsResp
                ? [channelsResp]
                : [];
            channels = channelsDb.map((c: any) => ({
              id: c.id,
              workspaceId: c.workspace_id,
              createdBy: c.created_by,
              name: c.name,
              description: c.description,
              members: c.members,
              icon: c.icon,
              color: c.color,
              createdAt: c.created_at ? new Date(c.created_at) : new Date(),
              updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
            }));
          } catch (error) {
            console.warn(
              `Failed to load channels for workspace ${ws.id}:`,
              error
            );
            // Continue without channels data
          }

          // Load posts for each board
          const boardsWithPosts = await Promise.all(
            ws.boards.map(async (board) => {
              const postsResp = await postApi.getPost({ boardId: board.id });
              const posts = Array.isArray(postsResp)
                ? (postsResp as Post[])
                : [postsResp as Post];

              // Fetch activities per post and attach to each post
              const postsWithActivities = await Promise.all(
                posts.map(async (p) => {
                  try {
                    const acts = await activityApi.getPostActivities(p.id);
                    return { ...p, activities: normalizeActivities(acts) };
                  } catch {
                    return {
                      ...p,
                      activities: normalizeActivities(p.activities),
                    };
                  }
                })
              );
              const transformedPosts = postsWithActivities.map((p) => ({
                id: p.id,
                workspaceId: p.workspaceId ?? ws.id,
                boardId: p.boardId,
                caption: p.caption,
                status: p.status as any,
                format: p.format,
                publishDate: p.publishDate ? new Date(p.publishDate) : null,
                updatedAt: p.updatedAt ? new Date(p.updatedAt) : null,
                platforms: (p.platforms || []) as any,
                pages: p.pages || [],
                billingMonth: p.billingMonth,
                month: p.month ?? 1,
                userColumns: (p as any).userColumns || [],
                settings: p.settings,
                hashtags: p.hashtags,
                blocks: p.blocks || [],
                comments: p.comments || [],
                activities: p.activities,
                createdBy: p.createdBy,
                lastUpdatedBy: p.lastUpdatedBy,
              }));

              return {
                ...board,
                columns: (board as any).columns,
                posts: transformedPosts,
              };
            })
          );

          // ws at this point already has social_accounts mapped in transformedWorkspaces
          return {
            ...ws,
            boards: boardsWithPosts,
            channels,
            brand: brand
              ? {
                  id: brand.id,
                  name: brand.name,
                  logo: brand.logo,
                  styleGuide: (brand as any).style_guide,
                  link: (brand as any).link,
                  voice: (brand as any).voice,
                  prefs: (brand as any).prefs,
                }
              : undefined,
            // socialAccounts/socialPages already set in the initial transform
          };
        })
      );

      // Decide active workspace:
      // - keep existing selection if it still exists
      // - otherwise, auto-select the first workspace (if any)
      let nextActiveWorkspaceId = workspaceStore.activeWorkspaceId ?? null;
      if (
        !nextActiveWorkspaceId ||
        !workspacesWithBrands.some((w) => w.id === nextActiveWorkspaceId)
      ) {
        nextActiveWorkspaceId = workspacesWithBrands[0]?.id ?? null;
      }

      const activeWs = nextActiveWorkspaceId
        ? workspacesWithBrands.find((w) => w.id === nextActiveWorkspaceId)
        : undefined;

      const boardNav = activeWs
        ? boardsToNav(activeWs.boards, activeWs.id)
        : [];
      const activeBrandId = activeWs?.brand?.id ?? null;
      const activeBoardId = activeWs?.boards[0]?.id ?? null;

      useWorkspaceStore.setState({
        workspaces: workspacesWithBrands,
        activeWorkspaceId: nextActiveWorkspaceId,
        activeBrandId,
        activeBoardId,
        boardNav,
        workspacesLoading: false,
        workspacesInitialized: true,
      });

      return workspacesWithBrands;
    } catch (error) {
      console.error('Failed to load user workspaces:', error);
      // ensure loading flags reset even on error
      useWorkspaceStore.setState({
        workspacesLoading: false,
        workspacesInitialized: true,
      });
      throw error;
    }
  },

  // Channel operations with store integration
  createChannelAndUpdateStore: async (
    workspaceId: string,
    createdBy: string,
    name: string,
    description?: string,
    members?: string[],
    icon?: string,
    color?: string
  ) => {
    try {
      const channel = await channelApi.createChannel({
        workspaceId: workspaceId,
        createdBy: createdBy,
        name,
        description,
        members,
        icon,
        color,
      });

      const workspaceStore = useWorkspaceStore.getState();
      const storeChannel = {
        id: channel.id,
        workspaceId: channel.workspaceId,
        createdBy: channel.createdBy,
        name: channel.name,
        description: channel.description,
        members: channel.members,
        icon: channel.icon,
        color: (channel as any).color,
        createdAt: channel.createdAt ? new Date(channel.createdAt) : new Date(),
        updatedAt: channel.updatedAt ? new Date(channel.updatedAt) : new Date(),
      };
      const updatedWorkspaces = workspaceStore.workspaces.map((w) => {
        if (w.id !== workspaceId) return w;
        const nextChannels = Array.isArray((w as any).channels)
          ? [...(w as any).channels, storeChannel]
          : [storeChannel];
        return { ...w, channels: nextChannels };
      });
      useWorkspaceStore.setState({ workspaces: updatedWorkspaces });
      return channel.id;
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  },

  updateChannelAndUpdateStore: async (id: string, updates: any) => {
    try {
      const channel = await channelApi.updateChannel(id, updates);
      const store = useWorkspaceStore.getState();
      const updatedWorkspaces = store.workspaces.map((w) => ({
        ...w,
        channels:
          (w as any).channels?.map((c: any) =>
            c.id === id ? { ...c, ...updates } : c
          ) || (w as any).channels,
      }));
      useWorkspaceStore.setState({ workspaces: updatedWorkspaces });
      return channel;
    } catch (error) {
      console.error('Failed to update channel:', error);
      throw error;
    }
  },

  deleteChannelAndUpdateStore: async (id: string) => {
    try {
      await channelApi.deleteChannel(id);
      const store = useWorkspaceStore.getState();
      const updatedWorkspaces = store.workspaces.map((w) => ({
        ...w,
        channels:
          (w as any).channels?.filter((c: Channel) => c.id !== id) ||
          (w as any).channels,
      }));
      useWorkspaceStore.setState({ workspaces: updatedWorkspaces });
    } catch (error) {
      console.error('Failed to delete channel:', error);
      throw error;
    }
  },

  // Channel Message operations with store integration
  fetchChannelMessagesAndUpdateStore: async (channelId: string) => {
    try {
      const resp = (await channelMessageApi.getChannelMessage({
        channelId: channelId,
      })) as Array<any>;
      const items = Array.isArray(resp) ? resp : resp ? [resp] : [];
      const transformed = items.map((m: any) => ({
        id: m.id,
        author: m.author_name || m.author_email,
        authorEmail: m.author_email,
        authorImageUrl: m.author_image_url || undefined,
        text: m.content,
        createdAt: m.created_at ? new Date(m.created_at) : new Date(),
        parentId: m.parent_id || null,
        addon: m.addon,
        readby: m.readby,
        emoticons: m.emoticons,
        channelId: channelId, // Add channel ID for consistency
      }));

      const prev = useMessageStore.getState().channelMessagesByChannelId || {};
      useMessageStore.setState({
        channelMessagesByChannelId: {
          ...prev,
          [channelId]: transformed,
        },
      });

      // Mark messages as read for current user
      try {
        const store = useUserStore.getState();
        const currentUserEmail = store.user?.email;
        if (currentUserEmail && items.length > 0) {
          // Get message IDs that should be marked as read
          const messageIds = items.map((m) => m.id);

          // Update unread messages in store
          const currentUnread = store.user?.unreadMsg || [];
          console.log('currentUnread: ', store.user);
          const newUnread = currentUnread.filter(
            (id) => !messageIds.includes(id)
          );
          const newRead = currentUnread.filter((id) => messageIds.includes(id));
          if (newUnread.length !== currentUnread.length) {
            useUserStore.setState({
              user: {
                ...store.user!,
                unreadMsg: newUnread,
              },
            });
          }
          console.log('channelmessageIds:', newRead);
          // Update unread messages in database for each message
          for (const messageId of newRead) {
            await userApi.removeUnreadMessage(currentUserEmail, messageId);
          }
        }
      } catch (unreadError) {
        console.error('Error marking messages as read:', unreadError);
        // Don't fail the message loading if unread update fails
      }

      return transformed;
    } catch (error) {
      console.error('Failed to fetch channel messages:', error);
      throw error;
    }
  },

  fetchAllWorkspaceMessagesAndUpdateStore: async () => {
    try {
      const store = useWorkspaceStore.getState();
      const activeWorkspaceId = store.activeWorkspaceId;
      if (!activeWorkspaceId) throw new Error('No active workspace');

      const resp = (await channelMessageApi.getChannelMessage({
        workspaceId: activeWorkspaceId,
      })) as Array<any>;
      const items = Array.isArray(resp) ? resp : resp ? [resp] : [];
      const transformed = items.map((m: any) => ({
        id: m.id,
        author: m.authorName || m.authorEmail,
        authorEmail: m.authorEmail,
        authorImageUrl: m.authorImageUrl || undefined,
        text: m.content,
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        parentId: m.parentId || null,
        addon: m.addon,
        readby: m.readby,
        emoticons: m.emoticons,
        channelId: m.channelId, // Add channel ID to identify which channel the message belongs to
      }));

      // Store all workspace messages under a special 'all' key
      const prev = useMessageStore.getState().channelMessagesByChannelId || {};
      useMessageStore.setState({
        channelMessagesByChannelId: {
          ...prev,
          all: transformed,
        },
      });

      // Mark messages as read for current user
      try {
        const userStore = useUserStore.getState();
        const currentUserEmail = userStore.user?.email;
        if (currentUserEmail && items.length > 0) {
          // Get message IDs that should be marked as read
          const messageIds = items.map((m) => m.id);

          // Update unread messages in store
          const currentUnread = userStore.user?.unreadMsg || [];
          const newUnread = currentUnread.filter(
            (id) => !messageIds.includes(id)
          );
          const newRead = currentUnread.filter((id) => messageIds.includes(id));

          if (newUnread.length !== currentUnread.length) {
            useUserStore.setState({
              user: {
                ...userStore.user!,
                unreadMsg: newUnread,
              },
            });
          }
          console.log('workspacemessageIds:', newRead);
          // Update unread messages in database for each message
          for (const messageId of newRead) {
            await userApi.removeUnreadMessage(currentUserEmail, messageId);
          }
        }
      } catch (unreadError) {
        console.error('Error marking messages as read:', unreadError);
        // Don't fail the message loading if unread update fails
      }

      return transformed;
    } catch (error) {
      console.error('Failed to fetch all workspace messages:', error);
      throw error;
    }
  },

  createChannelMessageAndUpdateStore: async (
    workspaceId: string,
    channelId: string,
    content: string,
    authorEmail: string,
    parentId?: string,
    addon?: any
  ) => {
    try {
      const created = await channelMessageApi.createChannelMessage({
        workspaceId: workspaceId,
        channelId: channelId,
        content,
        parentId: parentId,
        authorEmail: authorEmail,
        addon,
      });

      // Use current user profile for sender display
      const store = useUserStore.getState();
      const senderDisplayName = (store as any)?.user?.firstName || authorEmail;
      const senderImageUrl = (store as any)?.user?.imageUrl || undefined;

      const message = {
        id: created.id,
        author: senderDisplayName,
        authorEmail: authorEmail,
        authorImageUrl: senderImageUrl as string | undefined,
        text: created.content,
        createdAt: created.createdAt ? new Date(created.createdAt) : new Date(),
        parentId: created.parentId || null,
        addon: (created as any).addon,
        readby: (created as any).readby,
        emoticons: (created as any).emoticons,
        channelId: channelId,
      };

      const allMessages =
        (store as any).channelMessagesByChannelId?.['all'] || [];
      const channelMessages =
        (store as any).channelMessagesByChannelId?.[channelId] || [];
      useMessageStore.setState({
        channelMessagesByChannelId: {
          ...(store as any).channelMessagesByChannelId,
          [channelId]: [...channelMessages, message],
          all: [...allMessages, message],
        },
      });

      return created.id;
    } catch (error) {
      console.error('Failed to create channel message:', error);
      // If it's an API error with validation details, log them
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as any;
        if (apiError.message === 'Validation error' && apiError.details) {
          console.error('Validation error details:', apiError.details);
        }
      }
      throw error;
    }
  },

  // Workspace operations with store integration
  createWorkspaceAndUpdateStore: async (
    name: string,
    email: string,
    logo?: string,
    defaultBoardRules?: Record<string, any>
  ) => {
    try {
      const workspace = await workspaceApi.createWorkspace({
        name,
        logo,
        email,
        defaultBoardRules,
      });
      const store = useWorkspaceStore.getState();

      const newWorkspace = {
        id: workspace.id,
        name: workspace.name,
        logo: workspace.logo,
        clerk_organization_id: (workspace as any).clerk_organization_id,
        default_board_rules: (workspace as any).default_board_rules,
        timezone: (workspace as any).timezone,
        week_start: (workspace as any).week_start,
        time_format: (workspace as any).time_format,
        allowed_posting_time: (workspace as any).allowed_posting_time,
        boards: [],
        brand: undefined,
        socialAccounts: [],
        socialPages: [],
      } as any;

      store.workspaces = [...store.workspaces, newWorkspace];
      return workspace.id;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      throw error;
    }
  },

  updateWorkspaceAndUpdateStore: async (
    id: string,
    updates: { name?: string; logo?: string }
  ) => {
    try {
      const workspace = await workspaceApi.updateWorkspace(id, updates);
      const store = useWorkspaceStore.getState();

      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      );

      // Use Zustand setter to update store
      useWorkspaceStore.setState({
        workspaces: updatedWorkspaces,
      });

      return workspace;
    } catch (error) {
      console.error('Failed to update workspace:', error);
      throw error;
    }
  },

  deleteWorkspaceAndUpdateStore: async (id: string) => {
    try {
      await workspaceApi.deleteWorkspace(id);
      const store = useWorkspaceStore.getState();

      // Update store using Zustand setter to trigger re-renders
      const newWorkspaces = store.workspaces.filter((w) => w.id !== id);
      let newActiveWorkspaceId = store.activeWorkspaceId;
      let newActiveBrandId = store.activeBrandId;
      let newActiveBoardId = store.activeBoardId;

      if (store.activeWorkspaceId === id) {
        newActiveWorkspaceId = newWorkspaces[0]?.id || null;
        newActiveBrandId = null;
        newActiveBoardId = null;
      }

      // Use Zustand setter to update store
      useWorkspaceStore.setState({
        workspaces: newWorkspaces,
        activeWorkspaceId: newActiveWorkspaceId,
        activeBrandId: newActiveBrandId,
        activeBoardId: newActiveBoardId,
      });
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      throw error;
    }
  },

  // Brand operations with store integration
  createBrandAndUpdateStore: async (
    workspaceId: string,
    name: string,
    logo?: string,
    styleGuide?: any,
    link?: string,
    voice?: string,
    prefs?: string
  ) => {
    try {
      const brand = await brandApi.createBrand({
        workspaceId: workspaceId,
        name,
        logo,
        styleGuide: styleGuide,
        link,
        voice,
        prefs,
      });

      const store = useWorkspaceStore.getState();

      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map((w) => {
        if (w.id === workspaceId) {
          return {
            ...w,
            brand: {
              id: brand.id,
              name: brand.name,
              logo: brand.logo,
              styleGuide: brand.styleGuide,
              link: brand.link,
              voice: brand.voice,
              prefs: brand.prefs,
              platforms: [],
              socialAccounts: [],
              socialPages: [],
              contents: [],
            },
          };
        }
        return w;
      });

      // Use Zustand setter to update store
      useWorkspaceStore.setState({
        workspaces: updatedWorkspaces,
      });

      return brand.id;
    } catch (error) {
      console.error('Failed to create brand:', error);
      throw error;
    }
  },

  updateBrandAndUpdateStore: async (id: string, updates: any) => {
    try {
      const brand = await brandApi.updateBrand(id, updates);
      const store = useWorkspaceStore.getState();

      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map((w) => ({
        ...w,
        brand:
          w.brand && w.brand.id === id ? { ...w.brand, ...updates } : w.brand,
      }));

      // Use Zustand setter to update store
      useWorkspaceStore.setState({
        workspaces: updatedWorkspaces,
      });

      return brand;
    } catch (error) {
      console.error('Failed to update brand:', error);
      throw error;
    }
  },

  deleteBrandAndUpdateStore: async (id: string) => {
    try {
      await brandApi.deleteBrand(id);
      const store = useWorkspaceStore.getState();

      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map((w) => ({
        ...w,
        brand: w.brand && w.brand.id === id ? undefined : w.brand,
      }));

      // Update active brand if needed
      let newActiveBrandId = store.activeBrandId;
      if (store.activeBrandId === id) {
        const activeWorkspace = updatedWorkspaces.find(
          (w) => w.id === store.activeWorkspaceId
        );
        newActiveBrandId = activeWorkspace?.brand?.id || null;
      }

      // Use Zustand setter to update store
      useWorkspaceStore.setState({
        workspaces: updatedWorkspaces,
        activeBrandId: newActiveBrandId,
      });
    } catch (error) {
      console.error('Failed to delete brand:', error);
      throw error;
    }
  },

  // Board operations with store integration
  createBoardAndUpdateStore: async (
    workspaceId: string,
    name: string,
    description?: string,
    image?: string,
    color?: string,
    rules?: any
  ) => {
    try {
      const board = await boardApi.createBoard({
        workspaceId: workspaceId,
        name,
        description,
        image,
        color,
        rules,
      });

      // Fetch the posts that were automatically created for this board
      const posts = await postApi.getPost({ boardId: board.id });
      const boardPosts = Array.isArray(posts) ? posts : [posts];
      const boardPostsWithActivities = await Promise.all(
        boardPosts.map(async (post) => {
          try {
            const acts = await activityApi.getPostActivities(post.id);
            return { ...post, activities: normalizeActivities(acts) };
          } catch {
            return {
              ...post,
              activities: normalizeActivities(post.activities),
            };
          }
        })
      );

      const store = useWorkspaceStore.getState();

      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map((w) => {
        if (w.id === workspaceId) {
          return {
            ...w,
            boards: [
              ...w.boards,
              {
                id: board.id,
                name: board.name,
                image: board.image,
                description: board.description,
                color: board.color,
                rules: board.rules,
                columns: (board as any).columns,
                groupData: board.groupData || [],
                createdAt: new Date(),
                posts: boardPostsWithActivities.map((post) => ({
                  id: post.id,
                  workspaceId: post.workspaceId,
                  boardId: post.boardId,
                  caption: post.caption,
                  status: post.status as any,
                  format: post.format,
                  publishDate: post.publishDate
                    ? new Date(post.publishDate)
                    : null,
                  updatedAt: post.updatedAt ? new Date(post.updatedAt) : null,
                  platforms: (post.platforms || []) as any,
                  pages: post.pages || [],
                  billingMonth: post.billingMonth,
                  month: post.month || 1,
                  userColumns: (post as any).userColumns || [],
                  settings: post.settings,
                  hashtags: post.hashtags,
                  blocks: post.blocks || [],
                  comments: post.comments || [],
                  activities: normalizeActivities(post.activities),
                })),
              },
            ],
          };
        }
        return w;
      });

      // Update board navigation
      const activeWorkspace = updatedWorkspaces.find(
        (w) => w.id === workspaceId
      );
      const newBoardNav = activeWorkspace
        ? boardsToNav(activeWorkspace.boards, activeWorkspace.id)
        : [];

      // Use Zustand setter to update store
      useWorkspaceStore.setState({
        workspaces: updatedWorkspaces,
        boardNav: newBoardNav,
      });

      return board.id;
    } catch (error) {
      console.error('Failed to create board:', error);
      throw error;
    }
  },

  updateBoardAndUpdateStore: async (id: string, updates: any) => {
    try {
      const board = await boardApi.updateBoard(id, updates);
      const store = useWorkspaceStore.getState();

      // Update store using the server's latest board data to avoid drift
      const updatedWorkspaces = store.workspaces.map((w) => ({
        ...w,
        boards: w.boards.map((b) => {
          if (b.id !== id) return b;
          return {
            ...b,
            name: (board as any).name ?? b.name,
            image: (board as any).image ?? b.image,
            selectedImage: (board as any).selected_image ?? b.selectedImage,
            description: (board as any).description ?? b.description,
            color: (board as any).color ?? b.color,
            rules: (board as any).rules ?? b.rules,
            // Map server field group_data -> client field groupData
            groupData:
              (board as any).group_data !== undefined
                ? (board as any).group_data
                : updates.group_data !== undefined
                  ? updates.group_data
                  : b.groupData,
            columns:
              (board as any).columns !== undefined
                ? (board as any).columns
                : updates.columns !== undefined
                  ? updates.columns
                  : (b as any).columns,
          };
        }),
      }));

      // Update board navigation
      const activeWorkspace = updatedWorkspaces.find(
        (w) => w.id === store.activeWorkspaceId
      );
      const newBoardNav = activeWorkspace
        ? boardsToNav(activeWorkspace.boards, activeWorkspace.id)
        : [];

      useWorkspaceStore.setState({
        workspaces: updatedWorkspaces,
        boardNav: newBoardNav,
      });

      return board;
    } catch (error) {
      console.error('Failed to update board:', error);
      throw error;
    }
  },

  deleteBoardAndUpdateStore: async (id: string) => {
    try {
      await boardApi.deleteBoard(id);
      const store = useWorkspaceStore.getState();

      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map((w) => ({
        ...w,
        boards: w.boards.filter((b) => b.id !== id),
      }));

      // Update active board if needed
      let newActiveBoardId = store.activeBoardId;
      if (store.activeBoardId === id) {
        const activeWorkspace = updatedWorkspaces.find(
          (w) => w.id === store.activeWorkspaceId
        );
        newActiveBoardId = activeWorkspace?.boards[0]?.id || null;
      }

      // Update board navigation
      const activeWorkspace = updatedWorkspaces.find(
        (w) => w.id === store.activeWorkspaceId
      );
      const newBoardNav = activeWorkspace
        ? boardsToNav(activeWorkspace.boards, activeWorkspace.id)
        : [];

      // Use Zustand setter to update store
      useWorkspaceStore.setState({
        workspaces: updatedWorkspaces,
        activeBoardId: newActiveBoardId,
        boardNav: newBoardNav,
      });
    } catch (error) {
      console.error('Failed to delete board:', error);
      throw error;
    }
  },

  // Post operations with store integration
  createPostAndUpdateStore: async (
    workspaceId: string,
    boardId: string,
    postData: any,
    userEmail: string
  ) => {
    try {
      console.log('createPostAndUpdateStore', workspaceId, boardId, postData);
      const post = await postApi.createPost({
        workspaceId: workspaceId,
        boardId: boardId,
        ...postData,
        createdBy: userEmail,
        lastUpdatedBy: userEmail,
      });

      const store = useWorkspaceStore.getState();

      // Update store
      store.workspaces = store.workspaces.map((w) => ({
        ...w,
        boards: w.boards.map((b) => {
          if (b.id === boardId) {
            return {
              ...b,
              posts: [
                ...b.posts,
                {
                  id: post.id,
                  workspaceId: post.workspaceId,
                  boardId: post.boardId,
                  caption: post.caption,
                  status: post.status as any,
                  format: post.format,
                  publishDate: post.publishDate
                    ? new Date(post.publishDate)
                    : null,
                  updatedAt: post.updatedAt ? new Date(post.updatedAt) : null,
                  platforms: (post.platforms || []) as any,
                  pages: post.pages || [],
                  billingMonth: post.billingMonth,
                  month: post.month || 1,
                  userColumns: (post as any).userColumns || [],
                  settings: post.settings,
                  hashtags: post.hashtags,
                  blocks: post.blocks || [],
                  comments: post.comments || [],
                  activities: post.activities || [],
                  createdBy: post.createdBy,
                  lastUpdatedBy: post.lastUpdatedBy,
                },
              ],
            };
          }
          return b;
        }),
      }));
      // Trigger store update for listeners
      useWorkspaceStore.setState({ workspaces: store.workspaces });

      return post.id;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  },

  updatePostAndUpdateStore: async (
    id: string,
    updates: any,
    userEmail?: string
  ) => {
    try {
      const postUpdates = { ...updates };
      if (userEmail) {
        postUpdates.last_updated_by = userEmail;
      }
      console.log('postUpdates:', postUpdates);
      const post = await postApi.updatePost(id, postUpdates);
      console.log('post', post);
      const store = useWorkspaceStore.getState();

      // Update store
      store.workspaces = store.workspaces.map((w) => ({
        ...w,
        boards: w.boards.map((b) => ({
          ...b,
          posts: b.posts.map((p) => {
            if (p.id !== id) return p;

            // Special handling for user_columns to ensure proper merging
            if (updates.userColumns) {
              return {
                ...p,
                ...updates,
                userColumns: updates.userColumns,
                lastUpdatedBy: postUpdates.lastUpdatedBy,
              };
            }

            return {
              ...p,
              ...updates,
              last_updated_by: postUpdates.last_updated_by,
            };
          }),
        })),
      }));
      // Trigger store update for listeners
      useWorkspaceStore.setState({ workspaces: store.workspaces });

      return post;
    } catch (error) {
      console.error('Failed to update post:', error);
      throw error;
    }
  },

  autoScheduleAndUpdateStore: async (postId: string, status: string) => {
    try {
      const updated = await postApi.autoSchedule(postId, status);
      const store = useWorkspaceStore.getState();

      // Update store with server values
      store.workspaces = store.workspaces.map((w) => ({
        ...w,
        boards: w.boards.map((b) => ({
          ...b,
          posts: b.posts.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              status: (updated as any).status as any,
              publishDate: (updated as any).publishDate
                ? new Date((updated as any).publishDate)
                : null,
              updatedAt: (updated as any).updatedAt
                ? new Date((updated as any).updatedAt)
                : p.updatedAt,
            };
          }),
        })),
      }));
      useWorkspaceStore.setState({ workspaces: store.workspaces });
      return updated;
    } catch (error) {
      console.error('Failed to auto-schedule post:', error);
      throw error;
    }
  },

  updatePostBlocksAndUpdateStore: async (
    postId: string,
    blocks: any[],
    userEmail?: string
  ) => {
    try {
      const requestBody: any = {
        postId,
        blocks,
      };

      // Include user email if provided
      if (userEmail) {
        requestBody.last_updated_by = userEmail;
      }

      const response = await fetch('/api/post/update-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to update post blocks: ${response.status}`
        );
      }

      const result = await response.json();

      // Update Zustand store with the database result
      const store = useWorkspaceStore.getState();
      store.workspaces = store.workspaces.map((w) => ({
        ...w,
        boards: w.boards.map((b) => ({
          ...b,
          posts: b.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  blocks: result.post.blocks,
                  updatedAt: new Date(result.post.updated_at),
                  last_updated_by: userEmail,
                }
              : p
          ),
        })),
      }));

      // Trigger store update for listeners
      useWorkspaceStore.setState({ workspaces: store.workspaces });

      return result.post;
    } catch (error) {
      console.error('Failed to update post blocks:', error);
      throw error;
    }
  },

  deletePostAndUpdateStore: async (id: string) => {
    try {
      await postApi.deletePost(id);
      const store = useWorkspaceStore.getState();

      // Update store
      store.workspaces = store.workspaces.map((w) => ({
        ...w,
        boards: w.boards.map((b) => ({
          ...b,
          posts: b.posts.filter((p) => p.id !== id),
        })),
      }));
      // Trigger store update for listeners
      useWorkspaceStore.setState({ workspaces: store.workspaces });
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  },

  // Bulk create posts and update store
  bulkCreatePostsAndUpdateStore: async (
    workspaceId: string,
    boardId: string,
    postsData: any[],
    userEmail: string
  ) => {
    try {
      // Add user fields to each post
      const postsWithUserFields = postsData.map((post) => ({
        ...post,
        createdBy: userEmail,
        lastUpdatedBy: userEmail,
      }));

      const result = await postApi.bulkCreatePosts(postsWithUserFields);
      const store = useWorkspaceStore.getState();

      // Transform posts to match store format
      const transformedPosts = result.posts.map((post) => ({
        id: post.id,
        workspaceId: post.workspaceId,
        boardId: post.boardId,
        caption: post.caption,
        status: post.status as any,
        format: post.format,
        publishDate: post.publishDate ? new Date(post.publishDate) : null,
        updatedAt: post.updatedAt ? new Date(post.updatedAt) : null,
        platforms: (post.platforms || []) as any,
        pages: post.pages || [],
        billingMonth: post.billingMonth,
        month: post.month || 1,
        userColumns: (post as any).userColumns || [],
        settings: post.settings,
        hashtags: post.hashtags,
        blocks: post.blocks || [],
        comments: post.comments || [],
        activities: post.activities || [],
        createdBy: post.createdBy,
        lastUpdatedBy: post.lastUpdatedBy,
      }));

      // Update store
      store.workspaces = store.workspaces.map((w) => ({
        ...w,
        boards: w.boards.map((b) => {
          if (b.id === boardId) {
            return {
              ...b,
              posts: [...b.posts, ...transformedPosts],
            };
          }
          return b;
        }),
      }));
      // Trigger store update for listeners
      useWorkspaceStore.setState({ workspaces: store.workspaces });

      return result.posts.map((p) => p.id);
    } catch (error) {
      console.error('Failed to bulk create posts:', error);
      throw error;
    }
  },

  // Bulk delete posts and update store
  bulkDeletePostsAndUpdateStore: async (postIds: string[]) => {
    try {
      const result = await postApi.bulkDeletePosts(postIds);
      const store = useWorkspaceStore.getState();

      // Update store
      store.workspaces = store.workspaces.map((w) => ({
        ...w,
        boards: w.boards.map((b) => ({
          ...b,
          posts: b.posts.filter((p) => !postIds.includes(p.id)),
        })),
      }));
      // Trigger store update for listeners
      useWorkspaceStore.setState({ workspaces: store.workspaces });

      return result.deletedPosts;
    } catch (error) {
      console.error('Failed to bulk delete posts:', error);
      throw error;
    }
  },
};

// Helper function to convert boards to navigation
function boardsToNav(boards: any[], workspaceId?: string): any[] {
  return boards.map((board) => ({
    id: board.id,
    label: board.name,
    image: board.image,
    selectedImage: board.selectedImage,
    href: workspaceId
      ? `/${workspaceId}/content/${board.id}`
      : `/content/${board.id}`,
    color: board.color,
    rules: board.rules,
  }));
}

// Invite API
export const inviteApi = {
  inviteMembers: async (payload: {
    email: string;
    workspaceIds: string[];
    boardIds: string[];
    actorId?: string;
    organizationId?: string;
    role?: string;
    memberRole?: 'client' | 'team';
    firstName?: string;
  }): Promise<InviteResponse> => {
    return apiRequest<InviteResponse>('/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  inviteClient: async (payload: {
    email: string;
    workspaceId: string;
    actorId?: string;
    firstName?: string;
  }): Promise<InviteResponse> => {
    return apiRequest<InviteResponse>('/invite/client', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  inviteTeam: async (payload: {
    email: string;
    workspaceId: string;
    actorId?: string;
    firstName?: string;
  }): Promise<InviteResponse> => {
    return apiRequest<InviteResponse>('/invite/team', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// Comment API functions
export const commentApi = {
  // Post comments
  getPostComments: async (postId: string) => {
    return apiRequest<any[]>(`/post/comment?post_id=${postId}`);
  },

  addPostComment: async (data: {
    postId: string;
    text: string;
    parentId?: string;
    revisionRequested?: boolean;
    author: string;
    authorEmail?: string;
    authorImageUrl?: string;
  }) => {
    return apiRequest<any>('/post/comment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePostComment: async (
    postId: string,
    commentId: string,
    data: { text: string }
  ) => {
    return apiRequest<any>(
      `/post/comment?post_id=${postId}&comment_id=${commentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },

  deletePostComment: async (postId: string, commentId: string) => {
    return apiRequest<{ message: string }>(
      `/post/comment?post_id=${postId}&comment_id=${commentId}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Block comments
  getBlockComments: async (postId: string, blockId: string) => {
    return apiRequest<any[]>(
      `/post/block/comment?post_id=${postId}&block_id=${blockId}`
    );
  },

  addBlockComment: async (data: {
    postId: string;
    blockId: string;
    text: string;
    parentId?: string;
    revisionRequested?: boolean;
    author: string;
    authorEmail?: string;
    authorImageUrl?: string;
  }) => {
    return apiRequest<any>('/post/block/comment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBlockComment: async (
    postId: string,
    blockId: string,
    commentId: string,
    data: { text: string }
  ) => {
    return apiRequest<any>(
      `/post/block/comment?post_id=${postId}&block_id=${blockId}&comment_id=${commentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },

  deleteBlockComment: async (
    postId: string,
    blockId: string,
    commentId: string
  ) => {
    return apiRequest<{ message: string }>(
      `/post/block/comment?post_id=${postId}&block_id=${blockId}&comment_id=${commentId}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Version comments
  getVersionComments: async (
    postId: string,
    blockId: string,
    versionId: string
  ) => {
    return apiRequest<any[]>(
      `/post/block/version/comment?post_id=${postId}&block_id=${blockId}&version_id=${versionId}`
    );
  },

  addVersionComment: async (data: {
    postId: string;
    blockId: string;
    versionId: string;
    text: string;
    parentId?: string;
    revisionRequested?: boolean;
    author: string;
    authorEmail?: string;
    authorImageUrl?: string;
    rect?: { x: number; y: number; w: number; h: number };
  }) => {
    return apiRequest<any>('/post/block/version/comment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateVersionComment: async (
    postId: string,
    blockId: string,
    versionId: string,
    commentId: string,
    data: { text: string }
  ) => {
    return apiRequest<any>(
      `/post/block/version/comment?post_id=${postId}&block_id=${blockId}&version_id=${versionId}&comment_id=${commentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },

  deleteVersionComment: async (
    postId: string,
    blockId: string,
    versionId: string,
    commentId: string
  ) => {
    return apiRequest<{ message: string }>(
      `/post/block/version/comment?post_id=${postId}&block_id=${blockId}&version_id=${versionId}&comment_id=${commentId}`,
      {
        method: 'DELETE',
      }
    );
  },
};

// Social Account API functions
export const socialAccountApi = {
  // Get social accounts for a workspace
  getSocialAccounts: async (workspaceId: string) => {
    return apiRequest<SocialAccount[]>(
      `/social-account?workspaceId=${workspaceId}`
    );
  },

  // Disconnect social page or account
  disconnectSocial: async (data: {
    workspaceId: string;
    pageId?: string;
    accountId?: string;
  }) => {
    return apiRequest<{ success: boolean; message: string }>(
      '/social-account/disconnect',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },
};

// Social Set API functions
export const socialSetApi = {
  // Create social set
  createSocialSet: async (workspace_id: string, name: string) => {
    return apiRequest<any>('/social-set', {
      method: 'POST',
      body: JSON.stringify({ workspace_id, name }),
    });
  },
  // Update social set name
  updateSocialSetName: async (id: string, name: string) => {
    return apiRequest<any>('/social-set', {
      method: 'PATCH',
      body: JSON.stringify({ id, name }),
    });
  },
};

// Social Page API functions
export const socialPageApi = {
  // Move page to a different social set (or unassigned by passing null)
  moveToSet: async (page_id: string, social_set_id: string | null) => {
    return apiRequest<any>('/social-page', {
      method: 'PATCH',
      body: JSON.stringify({ page_id, social_set_id }),
    });
  },
};

// Re-export ApiError for backward compatibility
export { ApiError } from './api-types';

// Activity API functions
export const activityApi = {
  getPostActivities: async (postId: string) => {
    return apiRequest<any[]>(`/post/activity?post_id=${postId}`);
  },
  getWorkspaceActivities: async (workspaceId: string) => {
    return apiRequest<any[]>(
      `/workspace/activities?workspace_id=${workspaceId}`
    );
  },
  addActivity: async (data: {
    workspaceId: string;
    postId?: string;
    actorId: string;
    type:
      | 'revision_request'
      | 'revised'
      | 'approved'
      | 'scheduled'
      | 'published'
      | 'failed_publishing'
      | 'comment'
      | 'workspace_invited_sent'
      | 'board_invited_sent'
      | 'workspace_invited_accepted'
      | 'workspace_invited_declined'
      | 'workspace_access_requested';
    metadata?: any;
  }) => {
    return apiRequest<any>('/post/activity', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Notification API functions
export const notificationApi = {
  getUserNotifications: async (userEmail: string) => {
    return apiRequest<{ activities: any[] }>(
      `/user/notifications?user_email=${encodeURIComponent(userEmail)}`
    );
  },
  removeAllUnreadNotifications: async (userEmail: string) => {
    return apiRequest<{ success: boolean; cleared: string }>(
      '/user/notifications',
      {
        method: 'POST',
        body: JSON.stringify({
          userEmail: userEmail,
        }),
      }
    );
  },
  removeUnreadNotification: async (
    userEmail: string,
    notificationId: string
  ) => {
    return apiRequest<{ success: boolean; unread_notification: string[] }>(
      '/user/notifications',
      {
        method: 'PATCH',
        body: JSON.stringify({
          user_email: userEmail,
          notificationId: notificationId,
        }),
      }
    );
  },
};

// Notification Service API functions
export const notificationServiceApi = {
  // Get users with unread messages for notifications
  getUsersWithUnreadMessages: async () => {
    return apiRequest<
      Array<{
        id: string;
        email: string;
        firstName: string;
        unreadMsg: string[];
      }>
    >('/notification-service?endpoint=users-with-unread-messages');
  },

  // Get message details for notification processing
  getMessagesForNotifications: async (messageIds: string[]) => {
    return apiRequest<
      Array<{
        id: string;
        content: string;
        authorEmail: string;
        createdAt: string;
        channelId: string;
        workspaceId: string;
        sentNotification: boolean;
      }>
    >('/notification-service', {
      method: 'POST',
      body: JSON.stringify({ message_ids: messageIds }),
    });
  },

  // Get channel information
  getChannelsInfo: async (channelIds: string[]) => {
    return apiRequest<
      Array<{
        id: string;
        name: string;
      }>
    >('/notification-service', {
      method: 'POST',
      body: JSON.stringify({ channel_ids: channelIds }),
    });
  },

  // Get authors information
  getAuthorsInfo: async (authorEmails: string[]) => {
    return apiRequest<
      Array<{
        email: string;
        firstName: string;
        imageUrl: string;
      }>
    >('/notification-service', {
      method: 'POST',
      body: JSON.stringify({ author_emails: authorEmails }),
    });
  },

  // Mark messages as notification sent
  markNotificationsAsSent: async (messageIds: string[]) => {
    return apiRequest<{ success: boolean }>('/notification-service', {
      method: 'PATCH',
      body: JSON.stringify({ message_ids: messageIds }),
    });
  },
};

export const checkoutApi = {
  verifyCoupon: async (code: string) => {
    return apiRequest<{ coupon: Coupon }>(
      '/checkout/coupons/verify?code=' + encodeURIComponent(code),
      {
        method: 'GET',
      }
    );
  },
};

// Invitations API functions
export const invitationsApi = {
  // Get pending workspace invitations for current user
  getInvitations: async () => {
    return apiRequest<any[]>('/invitations');
  },
  // Accept an invitation
  acceptInvitation: async (
    invitationId: string,
    organizationId: string,
    workspaceId: string
  ) => {
    return apiRequest<any>(`/invitations/accept`, {
      method: 'POST',
      body: JSON.stringify({
        organizationId: organizationId,
        invitationId: invitationId,
        workspaceId: workspaceId,
      }),
    });
  },
  // Decline an invitation
  declineInvitation: async (
    invitationId: string,
    organizationId: string,
    workspaceId: string
  ) => {
    return apiRequest<any>(`/invitations/decline`, {
      method: 'POST',
      body: JSON.stringify({
        organizationId: organizationId,
        invitationId: invitationId,
        workspaceId: workspaceId,
      }),
    });
  },
  // Request access logging
  requestAccess: async (workspaceId: string, organizationId?: string) => {
    return apiRequest<any>(`/invitations/request-access`, {
      method: 'POST',
      body: JSON.stringify({ workspaceId, organizationId }),
    });
  },
};
