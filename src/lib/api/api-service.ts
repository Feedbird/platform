import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { User, Workspace, Brand, Board, Post } from '@/lib/supabase/client'

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
    
    return apiRequest<User>(`/user?${searchParams.toString()}`)
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
  getBrand: async (params: { id?: string; workspace_id?: string; include_social?: boolean }): Promise<Brand | null> => {
    const searchParams = new URLSearchParams()
    if (params.id) searchParams.append('id', params.id)
    if (params.workspace_id) searchParams.append('workspace_id', params.workspace_id)
    if (params.include_social) searchParams.append('include_social', 'true')
    
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

      // Fetch brand and posts for each workspace
      const workspacesWithBrands = await Promise.all(
        transformedWorkspaces.map(async ws => {
          const brandResp = await brandApi.getBrand({ workspace_id: ws.id, include_social: true })
          const brand = brandResp || null

          // Load posts for each board
          const boardsWithPosts = await Promise.all(
            ws.boards.map(async (board) => {
              const postsResp = await postApi.getPost({ board_id: board.id })
              const posts = Array.isArray(postsResp) ? postsResp as Post[] : [postsResp as Post]

              const transformedPosts = posts.map(p => ({
                id: p.id,
                workspaceId: p.workspace_id ?? ws.id,
                boardId: p.board_id,
                caption: p.caption,
                status: p.status as any,
                format: p.format,
                publishDate: p.publish_date ? new Date(p.publish_date) : null,
                updatedAt: p.updated_at ? new Date(p.updated_at) : null,
                platforms: (p.platforms || []) as any,
                pages: p.pages || [],
                billingMonth: p.billing_month,
                month: p.month ?? 1,
                settings: p.settings,
                hashtags: p.hashtags,
                blocks: p.blocks || [],
                comments: p.comments || [],
                activities: p.activities || []
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
            brand: brand ? {
              id: brand.id,
              name: brand.name,
              logo: brand.logo,
              styleGuide: (brand as any).style_guide,
              link: (brand as any).link,
              voice: (brand as any).voice,
              prefs: (brand as any).prefs,
              platforms: (brand as any).platforms || [],
              socialAccounts: ((brand as any).social_accounts || []).map((acc: any) => ({
                id: acc.id,
                platform: acc.platform,
                name: acc.name,
                accountId: acc.account_id,
                authToken: acc.auth_token,
                connected: acc.connected,
                status: acc.status,
                socialPages: acc.social_pages || []
              })),
              socialPages: ((brand as any).social_accounts || []).flatMap((acc: any) => 
                (acc.social_pages || []).map((page: any) => ({
                  id: page.id,
                  platform: page.platform,
                  entityType: page.entity_type || 'page',
                  name: page.name,
                  pageId: page.page_id,
                  authToken: page.auth_token,
                  connected: page.connected,
                  status: page.status,
                  accountId: acc.id,
                  statusUpdatedAt: page.status_updated_at ? new Date(page.status_updated_at) : undefined,
                  lastSyncAt: page.last_sync_at ? new Date(page.last_sync_at) : undefined,
                  followerCount: page.follower_count,
                  postCount: page.post_count,
                  metadata: page.metadata
                }))
              )
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
              posts: boardPosts.map(post => ({
                id: post.id,
                workspaceId: post.workspace_id,
                boardId: post.board_id,
                caption: post.caption,
                status: post.status as any,
                format: post.format,
                publishDate: post.publish_date ? new Date(post.publish_date) : null,
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
      
      // Update store using Zustand setter to trigger re-renders
      const updatedWorkspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.map(b => 
          b.id === id ? { ...b, ...updates } : b
        )
      }))
      
      // Update board navigation
      const activeWorkspace = updatedWorkspaces.find(w => w.id === store.activeWorkspaceId)
      const newBoardNav = activeWorkspace ? boardsToNav(activeWorkspace.boards) : []
      
      // Use Zustand setter to update store
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
                publishDate: post.publish_date ? new Date(post.publish_date) : null,
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
        publishDate: post.publish_date ? new Date(post.publish_date) : null,
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

// Social Account API functions
export const socialAccountApi = {
  // Get social accounts for a brand
  getSocialAccounts: async (brandId: string) => {
    return apiRequest<any[]>(`/social-account?brandId=${brandId}`)
  },

  // Disconnect social page or account
  disconnectSocial: async (data: {
    brandId: string
    pageId?: string
    accountId?: string
  }) => {
    return apiRequest<{ success: boolean; message: string }>('/social-account/disconnect', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

export { ApiError } 