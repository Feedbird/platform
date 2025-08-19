import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'

// Normalize activities from API/DB into store Activity shape
function normalizeActivities(items: any[] | undefined) {
  return (items || []).map((a: any) => {
    const created = a.created_at ?? a.at;
    const postId = a.post_id ?? a.postId;
    return {
      id: a.id,
      postId,
      actor: a.actor,
      action: a.action,
      type: a.type,
      at: created instanceof Date ? created : new Date(created),
      metadata: a.metadata,
    } as any;
  });
}
import { User, Workspace, Brand, Board, Post, Channel, ChannelMessage } from '@/lib/supabase/client'

// API Base URL
const API_BASE = '/api'

// Generic API error handler
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData.details
    )
  }

  return response.json()
}

// User API functions
export const userApi = {
  // Get user by ID or email
  getUser: async (params: { id?: string; email?: string }): Promise<User> => {
    const searchParams = new URLSearchParams()
    if (params.id) searchParams.append('id', params.id)
    if (params.email) searchParams.append('email', params.email)
    return apiRequest(`/user?${searchParams.toString()}`)
  },

  // Create new user
  createUser: async (userData: {
    email: string
    first_name?: string
    last_name?: string
    image_url?: string
  }): Promise<User> => {
    return apiRequest<User>('/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  // Update user
  updateUser: async (
    params: { id?: string; email?: string },
    updates: {
      first_name?: string
      last_name?: string
      image_url?: string
      unread_msg?: string[]
    }
  ): Promise<User> => {
    const searchParams = new URLSearchParams()
    if (params.id) searchParams.append('id', params.id)
    if (params.email) searchParams.append('email', params.email)
    return apiRequest<User>(`/user?${searchParams.toString()}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete user
  deleteUser: async (params: { id?: string; email?: string }): Promise<{ message: string }> => {
    const searchParams = new URLSearchParams()
    if (params.id) searchParams.append('id', params.id)
    if (params.email) searchParams.append('email', params.email)
    
    return apiRequest<{ message: string }>(`/user?${searchParams.toString()}`, {
      method: 'DELETE',
    })
  },

  addUnreadMessage: async (email: string, messageId: string): Promise<{ unread_msg: string[] }> => {
    const response = await apiRequest<{ unread_msg: string[] }>('/user/unread-messages', {
      method: 'POST',
      body: JSON.stringify({ email, message_id: messageId, action: 'add' }),
    })
    
    // Update the store after successful API request
    useFeedbirdStore.setState((prev: any) => ({
      user: prev.user ? {
        ...prev.user,
        unreadMsg: response.unread_msg
      } : null
    }))
    
    return response
  },

  removeUnreadMessage: async (email: string, messageId: string): Promise<{ unread_msg: string[] }> => {
    const response = await apiRequest<{ unread_msg: string[] }>('/user/unread-messages', {
      method: 'POST',
      body: JSON.stringify({ email, message_id: messageId, action: 'remove' }),
    })
    
    // Update the store after successful API request
    useFeedbirdStore.setState((prev: any) => ({
      user: prev.user ? {
        ...prev.user,
        unreadMsg: response.unread_msg
      } : null
    }))
    
    return response
  },
}
// Workspace helper endpoints
export const workspaceHelperApi = {
  // Get members + creator profiles for a workspace
  getWorkspaceMembers: async (workspace_id: string): Promise<{ users: { email: string; first_name?: string; image_url?: string }[] }> => {
    const searchParams = new URLSearchParams()
    searchParams.append('workspace_id', workspace_id)
    return apiRequest<{ users: { email: string; first_name?: string; image_url?: string }[] }>(`/workspace/members?${searchParams.toString()}`)
  },
}

// Workspace API functions
export const workspaceApi = {
  // Get workspace by ID or list all
  getWorkspace: async (id?: string): Promise<Workspace | Workspace[]> => {
    const endpoint = id ? `/workspace?id=${id}` : '/workspace'
    return apiRequest<Workspace | Workspace[]>(endpoint)
  },

  // Get workspaces (created + invited) for a specific user
  getWorkspacesByCreator: async (email: string): Promise<Workspace[]> => {
    const endpoint = `/workspace?email=${encodeURIComponent(email)}`
    return apiRequest<Workspace[]>(endpoint)
  },

  // Create new workspace
  createWorkspace: async (workspaceData: {
    name: string
    logo?: string
    email: string
  }): Promise<Workspace> => {
    console.log("workspaceData", workspaceData);
    return apiRequest<Workspace>('/workspace', {
      method: 'POST',
      body: JSON.stringify(workspaceData),
    })
  },

  // Update workspace
  updateWorkspace: async (
    id: string,
    updates: {
      name?: string
      logo?: string
    }
  ): Promise<Workspace> => {
    return apiRequest<Workspace>(`/workspace?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete workspace
  deleteWorkspace: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/workspace?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Brand API functions
export const brandApi = {
  // Get brand by ID or by workspace (now returns single brand)
  getBrand: async (params: { id?: string; workspace_id?: string }): Promise<Brand | null> => {
    const searchParams = new URLSearchParams()
    if (params.id) searchParams.append('id', params.id)
    if (params.workspace_id) searchParams.append('workspace_id', params.workspace_id)
    
    return apiRequest<Brand | null>(`/brand?${searchParams.toString()}`)
  },

  // Create new brand
  createBrand: async (brandData: {
    workspace_id: string
    name: string
    logo?: string
    style_guide?: any
    link?: string
    voice?: string
    prefs?: string
  }): Promise<Brand> => {
    return apiRequest<Brand>('/brand', {
      method: 'POST',
      body: JSON.stringify(brandData),
    })
  },

  // Update brand
  updateBrand: async (
    id: string,
    updates: {
      name?: string
      logo?: string
      style_guide?: any
      link?: string
      voice?: string
      prefs?: string
    }
  ): Promise<Brand> => {
    return apiRequest<Brand>(`/brand?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete brand
  deleteBrand: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/brand?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Board API functions
export const boardApi = {
  // Get board by ID or list by workspace
  getBoard: async (params: { id?: string; workspace_id?: string }): Promise<Board | Board[]> => {
    const searchParams = new URLSearchParams()
    if (params.id) searchParams.append('id', params.id)
    if (params.workspace_id) searchParams.append('workspace_id', params.workspace_id)
    
    return apiRequest<Board | Board[]>(`/board?${searchParams.toString()}`)
  },

  // Create new board
  createBoard: async (boardData: {
    workspace_id: string
    name: string
    image?: string
    description?: string
    color?: string
    rules?: any
  }): Promise<Board> => {
    return apiRequest<Board>('/board', {
      method: 'POST',
      body: JSON.stringify(boardData),
    })
  },

  // Update board
  updateBoard: async (
    id: string,
    updates: {
      name?: string
      image?: string
      selected_image?: string
      description?: string
      color?: string
      rules?: any
      group_data?: any
    }
  ): Promise<Board> => {
    return apiRequest<Board>(`/board?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete board
  deleteBoard: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/board?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Channel API functions
export const channelApi = {
  // Get channel by ID or list by workspace
  getChannel: async (params: { id?: string; workspace_id?: string }): Promise<Channel | Channel[]> => {
    const searchParams = new URLSearchParams()
    if (params.id) searchParams.append('id', params.id)
    if (params.workspace_id) searchParams.append('workspace_id', params.workspace_id)
    return apiRequest<Channel | Channel[]>(`/channel?${searchParams.toString()}`)
  },

  // Create new channel
  createChannel: async (channelData: {
    workspace_id: string
    created_by: string
    name: string
    description?: string
    members?: any
    icon?: string
    color?: string
  }): Promise<Channel> => {
    return apiRequest<Channel>('/channel', {
      method: 'POST',
      body: JSON.stringify(channelData),
    })
  },

  // Update channel
  updateChannel: async (
    id: string,
    updates: {
      name?: string
      description?: string
      members?: any
      icon?: string
      color?: string
    }
  ): Promise<Channel> => {
    return apiRequest<Channel>(`/channel?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete channel
  deleteChannel: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/channel?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Channel Message API functions
export const channelMessageApi = {
  // Get message by ID or list by channel/workspace
  getChannelMessage: async (params: { id?: string; channel_id?: string; workspace_id?: string }): Promise<(ChannelMessage & { author_name?: string; author_image_url?: string }) | Array<ChannelMessage & { author_name?: string; author_image_url?: string }>> => {
    const searchParams = new URLSearchParams()
    if (params.id) searchParams.append('id', params.id)
    if (params.channel_id) searchParams.append('channel_id', params.channel_id)
    if (params.workspace_id) searchParams.append('workspace_id', params.workspace_id)
    return apiRequest(`/channel-message?${searchParams.toString()}`)
  },

  // Create new channel message
  createChannelMessage: async (messageData: {
    workspace_id: string
    channel_id: string
    content: string
    parent_id?: string | null
    addon?: any
    readby?: any
    author_email: string
    emoticons?: any
  }): Promise<ChannelMessage> => {
    return apiRequest<ChannelMessage>('/channel-message', {
      method: 'POST',
      body: JSON.stringify(messageData),
    })
  },

  // Update channel message
  updateChannelMessage: async (
    id: string,
    updates: {
      content?: string
      addon?: any
      readby?: any
      emoticons?: any
    }
  ): Promise<ChannelMessage> => {
    return apiRequest<ChannelMessage>(`/channel-message?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete channel message
  deleteChannelMessage: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/channel-message?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Post API functions
export const postApi = {
  // Get post by ID or list by workspace/board
  getPost: async (params: { 
    id?: string; 
    workspace_id?: string; 
    board_id?: string 
  }): Promise<Post | Post[]> => {
    const searchParams = new URLSearchParams()
    if (params.id) searchParams.append('id', params.id)
    if (params.workspace_id) searchParams.append('workspace_id', params.workspace_id)
    if (params.board_id) searchParams.append('board_id', params.board_id)
    
    return apiRequest<Post | Post[]>(`/post?${searchParams.toString()}`)
  },

  // Create new post
  createPost: async (postData: {
    workspace_id: string
    board_id: string
    caption: any
    status: string
    format: string
    publish_date?: string
    platforms?: string[]
    pages?: string[]
    billing_month?: string
    month?: number
    settings?: any
    hashtags?: any
    blocks?: any[]
    comments?: any[]
    activities?: any[]
  }): Promise<Post> => {
    console.log("postData", postData);
    return apiRequest<Post>('/post', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  },

  // Update post
  updatePost: async (
    id: string,
    updates: {
      caption?: any
      status?: string
      format?: string
      publish_date?: string
      platforms?: string[]
      pages?: string[]
      billing_month?: string
      month?: number
      settings?: any
      hashtags?: any
      blocks?: any[]
      comments?: any[]
      activities?: any[]
    }
  ): Promise<Post> => {
    return apiRequest<Post>(`/post?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete post
  deletePost: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/post?id=${id}`, {
      method: 'DELETE',
    })
  },

  // Bulk create posts
  bulkCreatePosts: async (posts: {
    workspace_id: string
    board_id: string
    caption: any
    status: string
    format: string
    publish_date?: string
    platforms?: string[]
    pages?: string[]
    billing_month?: string
    month?: number
    settings?: any
    hashtags?: any
    blocks?: any[]
    comments?: any[]
    activities?: any[]
  }[]): Promise<{ message: string; posts: Post[] }> => {
    return apiRequest<{ message: string; posts: Post[] }>('/post/bulk', {
      method: 'POST',
      body: JSON.stringify({ posts }),
    })
  },

  // Bulk delete posts
  bulkDeletePosts: async (postIds: string[]): Promise<{ message: string; deleted_posts: Post[] }> => {
    return apiRequest<{ message: string; deleted_posts: Post[] }>('/post/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ post_ids: postIds }),
    })
  },

  // Auto-schedule post (server computes publish_date)
  autoSchedule: async (postId: string, status: string): Promise<Post> => {
    return apiRequest<Post>('/post/auto-schedule', {
      method: 'POST',
      body: JSON.stringify({ post_id: postId, status: status })
    })
  },
}

// Zustand store integration functions
export const storeApi = {
  // Load workspaces for current user
  loadUserWorkspaces: async (email: string) => {
    try {
      // mark loading in store
      useFeedbirdStore.setState({ workspacesLoading: true })

      const workspaces = await workspaceApi.getWorkspacesByCreator(email)
      const store = useFeedbirdStore.getState()
      
      // Transform workspaces - boards are already included from the API
      const transformedWorkspaces = workspaces.map(ws => {
        // Transform boards that came with the workspace
        const boards = (ws.boards || []).map(b => ({
          id: b.id,
          name: b.name,
          image: b.image,
          selectedImage: b.selected_image,
          description: b.description,
          color: b.color,
          rules: b.rules,
          createdAt: b.created_at ? new Date(b.created_at) : new Date(),
          groupData: (b as any).group_data || []
        }))

        return {
          id: ws.id,
          name: ws.name,
          logo: ws.logo,
          role: ws.role, // Include the role from API
          boards,
          brands: [] // Will be populated below
        }
      })

      // Helper to normalize activities from DB/API to store shape
      const normalizeActivities = (items: any[] | undefined) => {
        return (items || []).map((a: any) => {
          const created = a.created_at ?? a.at;
          const postId = a.post_id ?? a.postId;
          return {
            id: a.id,
            postId,
            actor: a.actor,
            action: a.action,
            type: a.type,
            at: created instanceof Date ? created : new Date(created),
            metadata: a.metadata,
          } as any;
        });
      };

      // Fetch brand and posts for each workspace
      const workspacesWithBrands = await Promise.all(
        transformedWorkspaces.map(async ws => {
          const brandResp = await brandApi.getBrand({ workspace_id: ws.id })
          const brand = brandResp || null

          // Load channels for this workspace and transform to store shape
          const channelsResp = await channelApi.getChannel({ workspace_id: ws.id })
          const channelsDb = Array.isArray(channelsResp) ? channelsResp : (channelsResp ? [channelsResp] : [])
          const channels = channelsDb.map((c: any) => ({
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
          }))

          // Load posts for each board
          const boardsWithPosts = await Promise.all(
            ws.boards.map(async (board) => {
              const postsResp = await postApi.getPost({ board_id: board.id })
              const posts = Array.isArray(postsResp) ? postsResp as Post[] : [postsResp as Post]

              // Fetch activities per post and attach to each post
              const postsWithActivities = await Promise.all(
                posts.map(async (p) => {
                  try {
                    const acts = await activityApi.getActivities(p.id)
                    return { ...p, activities: normalizeActivities(acts) }
                  } catch {
                    return { ...p, activities: normalizeActivities(p.activities) }
                  }
                })
              )

              const transformedPosts = postsWithActivities.map(p => ({
                id: p.id,
                workspaceId: p.workspace_id ?? ws.id,
                boardId: p.board_id,
                caption: p.caption,
                status: p.status as any,
                format: p.format,
                publish_date: p.publish_date ? new Date(p.publish_date) : null,
                updatedAt: p.updated_at ? new Date(p.updated_at) : null,
                platforms: (p.platforms || []) as any,
                pages: p.pages || [],
                billingMonth: p.billing_month,
                month: p.month ?? 1,
                settings: p.settings,
                hashtags: p.hashtags,
                blocks: p.blocks || [],
                comments: p.comments || [],
                activities: normalizeActivities(p.activities)
              }))

              return {
                ...board,
                posts: transformedPosts
              }
            })
          )

          return {
            ...ws,
            boards: boardsWithPosts,
            channels,
            brand: brand ? {
              id: brand.id,
              name: brand.name,
              logo: brand.logo,
              styleGuide: (brand as any).style_guide,
              link: (brand as any).link,
              voice: (brand as any).voice,
              prefs: (brand as any).prefs,
              platforms: (brand as any).platforms || [],
              socialAccounts: (brand as any).social_accounts || [],
              socialPages: (brand as any).social_pages || []
            } : undefined
          }
        })
      )

      // Decide active workspace:
      // - keep existing selection if it still exists
      // - otherwise, auto-select the first workspace (if any)
      let nextActiveWorkspaceId = store.activeWorkspaceId ?? null
      if (!nextActiveWorkspaceId || !workspacesWithBrands.some(w => w.id === nextActiveWorkspaceId)) {
        nextActiveWorkspaceId = workspacesWithBrands[0]?.id ?? null
      }

      const activeWs = nextActiveWorkspaceId
        ? workspacesWithBrands.find(w => w.id === nextActiveWorkspaceId)
        : undefined

      const boardNav = activeWs ? boardsToNav(activeWs.boards) : []
      const activeBrandId = activeWs?.brand?.id ?? null
      const activeBoardId = activeWs?.boards[0]?.id ?? null

      useFeedbirdStore.setState({
        workspaces: workspacesWithBrands,
        activeWorkspaceId: nextActiveWorkspaceId,
        activeBrandId,
        activeBoardId,
        boardNav,
        workspacesLoading: false,
        workspacesInitialized: true,
      })

      return workspacesWithBrands
    } catch (error) {
      console.error('Failed to load user workspaces:', error)
      // ensure loading flags reset even on error
      useFeedbirdStore.setState({ workspacesLoading: false, workspacesInitialized: true })
      throw error
    }
  },

  // Channel operations with store integration
  createChannelAndUpdateStore: async (
    workspaceId: string,
    createdBy: string,
    name: string,
    description?: string,
    members?: any,
    icon?: string,
    color?: string
  ) => {
    try {
      const channel = await channelApi.createChannel({
        workspace_id: workspaceId,
        created_by: createdBy,
        name,
        description,
        members,
        icon,
        color,
      })

      const store = useFeedbirdStore.getState()
      const storeChannel = {
        id: channel.id,
        workspaceId: channel.workspace_id,
        createdBy: channel.created_by,
        name: channel.name,
        description: channel.description,
        members: channel.members,
        icon: channel.icon,
        color: (channel as any).color,
        createdAt: channel.created_at ? new Date(channel.created_at) : new Date(),
        updatedAt: channel.updated_at ? new Date(channel.updated_at) : new Date(),
      }
      const updatedWorkspaces = store.workspaces.map(w => {
        if (w.id !== workspaceId) return w
        const nextChannels = Array.isArray((w as any).channels) ? [...(w as any).channels, storeChannel] : [storeChannel]
        return { ...w, channels: nextChannels }
      })
      useFeedbirdStore.setState({ workspaces: updatedWorkspaces })
      return channel.id
    } catch (error) {
      console.error('Failed to create channel:', error)
      throw error
    }
  },

  updateChannelAndUpdateStore: async (id: string, updates: any) => {
    try {
      const channel = await channelApi.updateChannel(id, updates)
      const store = useFeedbirdStore.getState()
      const updatedWorkspaces = store.workspaces.map(w => ({
        ...w,
        channels: (w as any).channels?.map((c: any) => (c.id === id ? { ...c, ...updates } : c)) || (w as any).channels
      }))
      useFeedbirdStore.setState({ workspaces: updatedWorkspaces })
      return channel
    } catch (error) {
      console.error('Failed to update channel:', error)
      throw error
    }
  },

  deleteChannelAndUpdateStore: async (id: string) => {
    try {
      await channelApi.deleteChannel(id)
      const store = useFeedbirdStore.getState()
      const updatedWorkspaces = store.workspaces.map(w => ({
        ...w,
        channels: (w as any).channels?.filter((c: Channel) => c.id !== id) || (w as any).channels
      }))
      useFeedbirdStore.setState({ workspaces: updatedWorkspaces })
    } catch (error) {
      console.error('Failed to delete channel:', error)
      throw error
    }
  },

  // Channel Message operations with store integration
  fetchChannelMessagesAndUpdateStore: async (channelId: string) => {
    try {
      const resp = await channelMessageApi.getChannelMessage({ channel_id: channelId }) as Array<any>
      const items = Array.isArray(resp) ? resp : (resp ? [resp] : [])
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
      }))

      const prev = useFeedbirdStore.getState().channelMessagesByChannelId || {}
      useFeedbirdStore.setState({
        channelMessagesByChannelId: {
          ...prev,
          [channelId]: transformed,
        },
      })

      // Mark messages as read for current user
      try {
        const store = useFeedbirdStore.getState()
        const currentUserEmail = store.user?.email
        if (currentUserEmail && items.length > 0) {
          // Get message IDs that should be marked as read
          const messageIds = items.map(m => m.id)
          
          // Update unread messages in store
          const currentUnread = store.user?.unreadMsg || []
          console.log("currentUnread: ", store.user);
          const newUnread = currentUnread.filter(id => !messageIds.includes(id))
          const newRead = currentUnread.filter(id => messageIds.includes(id))
          if (newUnread.length !== currentUnread.length) {
            useFeedbirdStore.setState({
              user: {
                ...store.user!,
                unreadMsg: newUnread
              }
            })
          }
          console.log("channelmessageIds:", newRead);
          // Update unread messages in database for each message
          for (const messageId of newRead) {
            await userApi.removeUnreadMessage(currentUserEmail, messageId)
          }
        }
      } catch (unreadError) {
        console.error('Error marking messages as read:', unreadError)
        // Don't fail the message loading if unread update fails
      }

      return transformed
    } catch (error) {
      console.error('Failed to fetch channel messages:', error)
      throw error
    }
  },

  fetchAllWorkspaceMessagesAndUpdateStore: async () => {
    try {
      const store = useFeedbirdStore.getState()
      const activeWorkspaceId = store.activeWorkspaceId
      if (!activeWorkspaceId) throw new Error('No active workspace')
      
      const resp = await channelMessageApi.getChannelMessage({ workspace_id: activeWorkspaceId }) as Array<any>
      const items = Array.isArray(resp) ? resp : (resp ? [resp] : [])
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
        channelId: m.channel_id, // Add channel ID to identify which channel the message belongs to
      }))

      // Store all workspace messages under a special 'all' key
      const prev = store.channelMessagesByChannelId || {}
      useFeedbirdStore.setState({
        channelMessagesByChannelId: {
          ...prev,
          all: transformed,
        },
      })

      // Mark messages as read for current user
      try {
        const currentUserEmail = store.user?.email
        if (currentUserEmail && items.length > 0) {
          // Get message IDs that should be marked as read
          const messageIds = items.map(m => m.id)
          
          // Update unread messages in store
          const currentUnread = store.user?.unreadMsg || []
          const newUnread = currentUnread.filter(id => !messageIds.includes(id))
          const newRead = currentUnread.filter(id => messageIds.includes(id))
          
          if (newUnread.length !== currentUnread.length) {
            useFeedbirdStore.setState({
              user: {
                ...store.user!,
                unreadMsg: newUnread
              }
            })
          }
          console.log("workspacemessageIds:", newRead);
          // Update unread messages in database for each message
          for (const messageId of newRead) {
            await userApi.removeUnreadMessage(currentUserEmail, messageId)
          }
        }
      } catch (unreadError) {
        console.error('Error marking messages as read:', unreadError)
        // Don't fail the message loading if unread update fails
      }

      return transformed
    } catch (error) {
      console.error('Failed to fetch all workspace messages:', error)
      throw error
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
        workspace_id: workspaceId,
        channel_id: channelId,
        content,
        parent_id: parentId,
        author_email: authorEmail,
        addon,
      })

      // Use current user profile for sender display
      const store = useFeedbirdStore.getState()
      const senderDisplayName = (store as any)?.user?.firstName || authorEmail
      const senderImageUrl = (store as any)?.user?.imageUrl || undefined

      const message = {
        id: created.id,
        author: senderDisplayName,
        authorEmail: authorEmail,
        authorImageUrl: senderImageUrl as string | undefined,
        text: created.content,
        createdAt: created.created_at ? new Date(created.created_at) : new Date(),
        parentId: created.parent_id || null,
        addon: (created as any).addon,
        readby: (created as any).readby,
        emoticons: (created as any).emoticons,
        channelId: channelId,
      }

      const allMessages = (store as any).channelMessagesByChannelId?.['all'] || []
      const channelMessages = (store as any).channelMessagesByChannelId?.[channelId] || []
      useFeedbirdStore.setState({
        channelMessagesByChannelId: {
          ...(store as any).channelMessagesByChannelId,
          [channelId]: [...channelMessages, message],
          all: [...allMessages, message],
        },
      })

      return created.id
    } catch (error) {
      console.error('Failed to create channel message:', error)
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

  // Workspace operations with store integration
  createWorkspaceAndUpdateStore: async (name: string, email: string, logo?: string) => {
    try {
      const workspace = await workspaceApi.createWorkspace({ name, logo, email })
      const store = useFeedbirdStore.getState()

      const newWorkspace = {
        id: workspace.id,
        name: workspace.name,
        logo: workspace.logo,
        boards: [],
        brands: []
      }

      store.workspaces = [...store.workspaces, newWorkspace]
      return workspace.id
    } catch (error) {
      console.error('Failed to create workspace:', error)
      throw error
    }
  },

  updateWorkspaceAndUpdateStore: async (id: string, updates: { name?: string; logo?: string }) => {
    try {
      const workspace = await workspaceApi.updateWorkspace(id, updates)
      const store = useFeedbirdStore.getState()
      
      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map(w => 
        w.id === id ? { ...w, ...updates } : w
      )
      
      // Use Zustand setter to update store
      useFeedbirdStore.setState({
        workspaces: updatedWorkspaces
      })
      
      return workspace
    } catch (error) {
      console.error('Failed to update workspace:', error)
      throw error
    }
  },

  deleteWorkspaceAndUpdateStore: async (id: string) => {
    try {
      await workspaceApi.deleteWorkspace(id)
      const store = useFeedbirdStore.getState()
      
      // Update store using Zustand setter to trigger re-renders
      const newWorkspaces = store.workspaces.filter(w => w.id !== id)
      let newActiveWorkspaceId = store.activeWorkspaceId
      let newActiveBrandId = store.activeBrandId
      let newActiveBoardId = store.activeBoardId
      
      if (store.activeWorkspaceId === id) {
        newActiveWorkspaceId = newWorkspaces[0]?.id || null
        newActiveBrandId = null
        newActiveBoardId = null
      }
      
      // Use Zustand setter to update store
      useFeedbirdStore.setState({
        workspaces: newWorkspaces,
        activeWorkspaceId: newActiveWorkspaceId,
        activeBrandId: newActiveBrandId,
        activeBoardId: newActiveBoardId
      })
    } catch (error) {
      console.error('Failed to delete workspace:', error)
      throw error
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
        workspace_id: workspaceId,
        name,
        logo,
        style_guide: styleGuide,
        link,
        voice,
        prefs
      })
      
      const store = useFeedbirdStore.getState()
      
      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map(w => {
        if (w.id === workspaceId) {
          return {
            ...w,
            brand: {
              id: brand.id,
              name: brand.name,
              logo: brand.logo,
              styleGuide: brand.style_guide,
              link: brand.link,
              voice: brand.voice,
              prefs: brand.prefs,
              platforms: [],
              socialAccounts: [],
              socialPages: [],
              contents: []
            }
          }
        }
        return w
      })
      
      // Use Zustand setter to update store
      useFeedbirdStore.setState({
        workspaces: updatedWorkspaces
      })
      
      return brand.id
    } catch (error) {
      console.error('Failed to create brand:', error)
      throw error
    }
  },

  updateBrandAndUpdateStore: async (id: string, updates: any) => {
    try {
      const brand = await brandApi.updateBrand(id, updates)
      const store = useFeedbirdStore.getState()
      
      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map(w => ({
        ...w,
        brand: w.brand && w.brand.id === id ? { ...w.brand, ...updates } : w.brand
      }))
      
      // Use Zustand setter to update store
      useFeedbirdStore.setState({
        workspaces: updatedWorkspaces
      })
      
      return brand
    } catch (error) {
      console.error('Failed to update brand:', error)
      throw error
    }
  },

  deleteBrandAndUpdateStore: async (id: string) => {
    try {
      await brandApi.deleteBrand(id)
      const store = useFeedbirdStore.getState()
      
      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map(w => ({
        ...w,
        brand: w.brand && w.brand.id === id ? undefined : w.brand
      }))
      
      // Update active brand if needed
      let newActiveBrandId = store.activeBrandId
      if (store.activeBrandId === id) {
        const activeWorkspace = updatedWorkspaces.find(w => w.id === store.activeWorkspaceId)
        newActiveBrandId = activeWorkspace?.brand?.id || null
      }
      
      // Use Zustand setter to update store
      useFeedbirdStore.setState({
        workspaces: updatedWorkspaces,
        activeBrandId: newActiveBrandId
      })
    } catch (error) {
      console.error('Failed to delete brand:', error)
      throw error
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
      console.log("@@@@@@@createBoardAndUpdateStore:", workspaceId, name, description, image, color, rules);
      const board = await boardApi.createBoard({
        workspace_id: workspaceId,
        name,
        description,
        image,
        color,
        rules
      })
      
      // Fetch the posts that were automatically created for this board
      const posts = await postApi.getPost({ board_id: board.id })
      const boardPosts = Array.isArray(posts) ? posts : [posts]
      const boardPostsWithActivities = await Promise.all(
        boardPosts.map(async (post) => {
          try {
            const acts = await activityApi.getActivities(post.id)
            return { ...post, activities: normalizeActivities(acts) }
          } catch {
            return { ...post, activities: normalizeActivities(post.activities) }
          }
        })
      )
      
      const store = useFeedbirdStore.getState()
      
      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map(w => {
        if (w.id === workspaceId) {
          return {
            ...w,
            boards: [...w.boards, {
              id: board.id,
              name: board.name,
              image: board.image,
              description: board.description,
              color: board.color,
              rules: board.rules,
              groupData: board.group_data || [],
              createdAt: new Date(),
                 posts: boardPostsWithActivities.map(post => ({
                id: post.id,
                workspaceId: post.workspace_id,
                boardId: post.board_id,
                caption: post.caption,
                status: post.status as any,
                format: post.format,
                publish_date: post.publish_date ? new Date(post.publish_date) : null,
                updatedAt: post.updated_at ? new Date(post.updated_at) : null,
                platforms: (post.platforms || []) as any,
                pages: post.pages || [],
                billingMonth: post.billing_month,
                month: post.month || 1,
                settings: post.settings,
                hashtags: post.hashtags,
                blocks: post.blocks || [],
                comments: post.comments || [],
                   activities: normalizeActivities(post.activities)
              }))
            }]
          }
        }
        return w
      })
      
      // Update board navigation
      const activeWorkspace = updatedWorkspaces.find(w => w.id === workspaceId)
      const newBoardNav = activeWorkspace ? boardsToNav(activeWorkspace.boards) : []
      
      // Use Zustand setter to update store
      useFeedbirdStore.setState({
        workspaces: updatedWorkspaces,
        boardNav: newBoardNav
      })
      
      return board.id
    } catch (error) {
      console.error('Failed to create board:', error)
      throw error
    }
  },

  updateBoardAndUpdateStore: async (id: string, updates: any) => {
    try {
      const board = await boardApi.updateBoard(id, updates)
      const store = useFeedbirdStore.getState()

      // Update store using the server's latest board data to avoid drift
      const updatedWorkspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.map(b => {
          if (b.id !== id) return b
          return {
            ...b,
            name: (board as any).name ?? b.name,
            image: (board as any).image ?? b.image,
            selectedImage: (board as any).selected_image ?? b.selectedImage,
            description: (board as any).description ?? b.description,
            color: (board as any).color ?? b.color,
            rules: (board as any).rules ?? b.rules,
            // Map server field group_data -> client field groupData
            groupData: (board as any).group_data !== undefined ? (board as any).group_data : (updates.group_data !== undefined ? updates.group_data : b.groupData),
          }
        })
      }))

      // Update board navigation
      const activeWorkspace = updatedWorkspaces.find(w => w.id === store.activeWorkspaceId)
      const newBoardNav = activeWorkspace ? boardsToNav(activeWorkspace.boards) : []

      useFeedbirdStore.setState({
        workspaces: updatedWorkspaces,
        boardNav: newBoardNav
      })

      return board
    } catch (error) {
      console.error('Failed to update board:', error)
      throw error
    }
  },

  deleteBoardAndUpdateStore: async (id: string) => {
    try {
      await boardApi.deleteBoard(id)
      const store = useFeedbirdStore.getState()
      
      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.filter(b => b.id !== id)
      }))
      
      // Update active board if needed
      let newActiveBoardId = store.activeBoardId
      if (store.activeBoardId === id) {
        const activeWorkspace = updatedWorkspaces.find(w => w.id === store.activeWorkspaceId)
        newActiveBoardId = activeWorkspace?.boards[0]?.id || null
      }
      
      // Update board navigation
      const activeWorkspace = updatedWorkspaces.find(w => w.id === store.activeWorkspaceId)
      const newBoardNav = activeWorkspace ? boardsToNav(activeWorkspace.boards) : []
      
      // Use Zustand setter to update store
      useFeedbirdStore.setState({
        workspaces: updatedWorkspaces,
        activeBoardId: newActiveBoardId,
        boardNav: newBoardNav
      })
    } catch (error) {
      console.error('Failed to delete board:', error)
      throw error
    }
  },

  // Post operations with store integration
  createPostAndUpdateStore: async (
    workspaceId: string,
    boardId: string,
    postData: any
  ) => {
    try {
      console.log("createPostAndUpdateStore", workspaceId, boardId, postData);
      const post = await postApi.createPost({
        workspace_id: workspaceId,
        board_id: boardId,
        ...postData
      })
      
      const store = useFeedbirdStore.getState()
      
      // Update store
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.map(b => {
          if (b.id === boardId) {
            return {
              ...b,
              posts: [...b.posts, {
                id: post.id,
                workspaceId: post.workspace_id,
                boardId: post.board_id,
                caption: post.caption,
                status: post.status as any,
                format: post.format,
                publish_date: post.publish_date ? new Date(post.publish_date) : null,
                updatedAt: post.updated_at ? new Date(post.updated_at) : null,
                platforms: (post.platforms || []) as any,
                pages: post.pages || [],
                billingMonth: post.billing_month,
                month: post.month || 1,
                settings: post.settings,
                hashtags: post.hashtags,
                blocks: post.blocks || [],
                comments: post.comments || [],
                activities: post.activities || []
              }]
            }
          }
          return b
        })
      }))
      // Trigger store update for listeners
      useFeedbirdStore.setState({ workspaces: store.workspaces });
      
      return post.id
    } catch (error) {
      console.error('Failed to create post:', error)
      throw error
    }
  },

  updatePostAndUpdateStore: async (id: string, updates: any) => {
    try {
      const post = await postApi.updatePost(id, updates)
      const store = useFeedbirdStore.getState()
      
      // Update store
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.map(b => ({
          ...b,
          posts: b.posts.map(p => 
            p.id === id ? { ...p, ...updates } : p
          )
        }))
      }))
      // Trigger store update for listeners
      useFeedbirdStore.setState({ workspaces: store.workspaces });
      
      return post
    } catch (error) {
      console.error('Failed to update post:', error)
      throw error
    }
  },

  autoScheduleAndUpdateStore: async (postId: string, status: string) => {
    try {
      const updated = await postApi.autoSchedule(postId, status)
      const store = useFeedbirdStore.getState()

      // Update store with server values
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.map(b => ({
          ...b,
          posts: b.posts.map(p => {
            if (p.id !== postId) return p
            return {
              ...p,
              status: (updated as any).status as any,
              publish_date: (updated as any).publish_date ? new Date((updated as any).publish_date) : null,
              updatedAt: (updated as any).updated_at ? new Date((updated as any).updated_at) : p.updatedAt,
            }
          })
        }))
      }))
      useFeedbirdStore.setState({ workspaces: store.workspaces })
      return updated
    } catch (error) {
      console.error('Failed to auto-schedule post:', error)
      throw error
    }
  },

  updatePostBlocksAndUpdateStore: async (postId: string, blocks: any[]) => {
    try {
      const response = await fetch('/api/post/update-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          blocks
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update post blocks: ${response.status}`);
      }

      const result = await response.json();
      
      // Update Zustand store with the database result
      const store = useFeedbirdStore.getState();
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.map(b => ({
          ...b,
          posts: b.posts.map(p => 
            p.id === postId ? { 
              ...p, 
              blocks: result.post.blocks,
              updatedAt: new Date(result.post.updated_at)
            } : p
          )
        }))
      }));
      
      // Trigger store update for listeners
      useFeedbirdStore.setState({ workspaces: store.workspaces });
      
      return result.post
    } catch (error) {
      console.error('Failed to update post blocks:', error)
      throw error
    }
  },

  deletePostAndUpdateStore: async (id: string) => {
    try {
      await postApi.deletePost(id)
      const store = useFeedbirdStore.getState()
      
      // Update store
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.map(b => ({
          ...b,
          posts: b.posts.filter(p => p.id !== id)
        }))
      }))
      // Trigger store update for listeners
      useFeedbirdStore.setState({ workspaces: store.workspaces });
    } catch (error) {
      console.error('Failed to delete post:', error)
      throw error
    }
  },

  // Bulk create posts and update store
  bulkCreatePostsAndUpdateStore: async (
    workspaceId: string,
    boardId: string,
    postsData: any[]
  ) => {
    try {
      const result = await postApi.bulkCreatePosts(postsData)
      const store = useFeedbirdStore.getState()
      
      // Transform posts to match store format
      const transformedPosts = result.posts.map(post => ({
        id: post.id,
        workspaceId: post.workspace_id,
        boardId: post.board_id,
        caption: post.caption,
        status: post.status as any,
        format: post.format,
        publish_date: post.publish_date ? new Date(post.publish_date) : null,
        updatedAt: post.updated_at ? new Date(post.updated_at) : null,
        platforms: (post.platforms || []) as any,
        pages: post.pages || [],
        billingMonth: post.billing_month,
        month: post.month || 1,
        settings: post.settings,
        hashtags: post.hashtags,
        blocks: post.blocks || [],
        comments: post.comments || [],
        activities: post.activities || []
      }))
      
      // Update store
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.map(b => {
          if (b.id === boardId) {
            return {
              ...b,
              posts: [...b.posts, ...transformedPosts]
            }
          }
          return b
        })
      }))
      // Trigger store update for listeners
      useFeedbirdStore.setState({ workspaces: store.workspaces });
      
      return result.posts.map(p => p.id)
    } catch (error) {
      console.error('Failed to bulk create posts:', error)
      throw error
    }
  },

  // Bulk delete posts and update store
  bulkDeletePostsAndUpdateStore: async (postIds: string[]) => {
    try {
      const result = await postApi.bulkDeletePosts(postIds)
      const store = useFeedbirdStore.getState()
      
      // Update store
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.map(b => ({
          ...b,
          posts: b.posts.filter(p => !postIds.includes(p.id))
        }))
      }))
      // Trigger store update for listeners
      useFeedbirdStore.setState({ workspaces: store.workspaces });
      
      return result.deleted_posts
    } catch (error) {
      console.error('Failed to bulk delete posts:', error)
      throw error
    }
  }
}

// Helper function to convert boards to navigation
function boardsToNav(boards: any[]): any[] {
  return boards.map(board => ({
    id: board.id,
    label: board.name,
    image: board.image,
    selectedImage: board.selectedImage,
    href: `/content/${board.id}`,
    color: board.color,
    rules: board.rules
  }))
}

// Invite API
export const inviteApi = {
  inviteMembers: async (payload: { email: string; workspaceIds: string[]; boardIds: string[] }) => {
    return apiRequest<{ message: string; details?: string; warning?: boolean }>('/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

// Comment API functions
export const commentApi = {
  // Post comments
  getPostComments: async (postId: string) => {
    return apiRequest<any[]>(`/post/comment?post_id=${postId}`)
  },

  addPostComment: async (data: {
    post_id: string
    text: string
    parent_id?: string
    revision_requested?: boolean
    author: string
    authorEmail?: string
    authorImageUrl?: string
  }) => {
    return apiRequest<any>('/post/comment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updatePostComment: async (postId: string, commentId: string, data: { text: string }) => {
    return apiRequest<any>(`/post/comment?post_id=${postId}&comment_id=${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deletePostComment: async (postId: string, commentId: string) => {
    return apiRequest<{ message: string }>(`/post/comment?post_id=${postId}&comment_id=${commentId}`, {
      method: 'DELETE',
    })
  },

  // Block comments
  getBlockComments: async (postId: string, blockId: string) => {
    return apiRequest<any[]>(`/post/block/comment?post_id=${postId}&block_id=${blockId}`)
  },

  addBlockComment: async (data: {
    post_id: string
    block_id: string
    text: string
    parent_id?: string
    revision_requested?: boolean
    author: string
    authorEmail?: string
    authorImageUrl?: string
  }) => {
    return apiRequest<any>('/post/block/comment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateBlockComment: async (postId: string, blockId: string, commentId: string, data: { text: string }) => {
    return apiRequest<any>(`/post/block/comment?post_id=${postId}&block_id=${blockId}&comment_id=${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteBlockComment: async (postId: string, blockId: string, commentId: string) => {
    return apiRequest<{ message: string }>(`/post/block/comment?post_id=${postId}&block_id=${blockId}&comment_id=${commentId}`, {
      method: 'DELETE',
    })
  },

  // Version comments
  getVersionComments: async (postId: string, blockId: string, versionId: string) => {
    return apiRequest<any[]>(`/post/block/version/comment?post_id=${postId}&block_id=${blockId}&version_id=${versionId}`)
  },

  addVersionComment: async (data: {
    post_id: string
    block_id: string
    version_id: string
    text: string
    parent_id?: string
    revision_requested?: boolean
    author: string
    authorEmail?: string
    authorImageUrl?: string
    rect?: { x: number; y: number; w: number; h: number }
  }) => {
    return apiRequest<any>('/post/block/version/comment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateVersionComment: async (postId: string, blockId: string, versionId: string, commentId: string, data: { text: string }) => {
    return apiRequest<any>(`/post/block/version/comment?post_id=${postId}&block_id=${blockId}&version_id=${versionId}&comment_id=${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteVersionComment: async (postId: string, blockId: string, versionId: string, commentId: string) => {
    return apiRequest<{ message: string }>(`/post/block/version/comment?post_id=${postId}&block_id=${blockId}&version_id=${versionId}&comment_id=${commentId}`, {
      method: 'DELETE',
    })
  },
}

export { ApiError } 
 
// Activity API functions
export const activityApi = {
  getActivities: async (postId: string) => {
    return apiRequest<any[]>(`/post/activity?post_id=${postId}`)
  },
  addActivity: async (data: {
    post_id: string
    actor: string
    action: string
    type: 'revision_request' | 'revised' | 'approved' | 'scheduled' | 'published' | 'failed_publishing'
    metadata?: any
  }) => {
    return apiRequest<any>('/post/activity', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}