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

// Post API functions
export const postApi = {
  // Get post by ID or list by brand/board
  getPost: async (params: { 
    id?: string; 
    brand_id?: string; 
    board_id?: string 
  }): Promise<Post | Post[]> => {
    const searchParams = new URLSearchParams()
    if (params.id) searchParams.append('id', params.id)
    if (params.brand_id) searchParams.append('brand_id', params.brand_id)
    if (params.board_id) searchParams.append('board_id', params.board_id)
    
    return apiRequest<Post | Post[]>(`/post?${searchParams.toString()}`)
  },

  // Create new post
  createPost: async (postData: {
    brand_id: string
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
}

// Zustand store integration functions
export const storeApi = {
  // Load workspaces for current user
  loadUserWorkspaces: async (email: string) => {
    try {
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
          const brandResp = await brandApi.getBrand({ workspace_id: ws.id })
          const brand = brandResp || null

          // Load posts for the brand if it exists
          let transformedPosts: any[] = []
          if (brand) {
            const postsResp = await postApi.getPost({ brand_id: brand.id })
            const posts = Array.isArray(postsResp) ? postsResp as Post[] : [postsResp as Post]

            transformedPosts = posts.map(p => ({
              id: p.id,
              brandId: p.brand_id ?? brand.id,
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
          }

          return {
            ...ws,
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
              socialPages: (brand as any).social_pages || [],
              contents: transformedPosts
            } : undefined
          }
        })
      )

      // Update Zustand store in a single batched update so that subscribers are notified.
      // Keep whatever workspace the user already selected. If none, leave it null
      const activeWorkspaceId = store.activeWorkspaceId ?? null

      // Derive board navigation only if an active workspace is set
      const activeWs = workspacesWithBrands.find(w => w.id === activeWorkspaceId)
      const boardNav = activeWs ? boardsToNav(activeWs.boards) : []

      useFeedbirdStore.setState({
        workspaces: workspacesWithBrands,
        boardNav,
        // NOTE: we intentionally do NOT force-select an active workspace here
      })

      return workspacesWithBrands
    } catch (error) {
      console.error('Failed to load user workspaces:', error)
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
      
      // Update store
      store.workspaces = store.workspaces.map(w => 
        w.id === id ? { ...w, ...updates } : w
      )
      
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
      
      // Update store
      const newWorkspaces = store.workspaces.filter(w => w.id !== id)
      let newActiveWorkspaceId = store.activeWorkspaceId
      let newActiveBrandId = store.activeBrandId
      let newActiveBoardId = store.activeBoardId
      
      if (store.activeWorkspaceId === id) {
        newActiveWorkspaceId = newWorkspaces[0]?.id || null
        newActiveBrandId = null
        newActiveBoardId = null
      }
      
      store.workspaces = newWorkspaces
      store.activeWorkspaceId = newActiveWorkspaceId
      store.activeBrandId = newActiveBrandId
      store.activeBoardId = newActiveBoardId
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
      
      // Update store
      store.workspaces = store.workspaces.map(w => {
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
      
      // Update store
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        brand: w.brand && w.brand.id === id ? { ...w.brand, ...updates } : w.brand
      }))
      
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
      
      // Update store
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        brand: w.brand && w.brand.id === id ? undefined : w.brand
      }))
      
      // Update active brand if needed
      if (store.activeBrandId === id) {
        const activeWorkspace = store.workspaces.find(w => w.id === store.activeWorkspaceId)
        store.activeBrandId = activeWorkspace?.brand?.id || null
      }
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
      
      const store = useFeedbirdStore.getState()
      
      // Update store
      store.workspaces = store.workspaces.map(w => {
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
              createdAt: new Date()
            }]
          }
        }
        return w
      })
      
      // Update board navigation
      const activeWorkspace = store.workspaces.find(w => w.id === workspaceId)
      if (activeWorkspace) {
        store.boardNav = boardsToNav(activeWorkspace.boards)
      }
      
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
      
      // Update store
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.map(b => 
          b.id === id ? { ...b, ...updates } : b
        )
      }))
      
      // Update board navigation
      const activeWorkspace = store.workspaces.find(w => w.id === store.activeWorkspaceId)
      if (activeWorkspace) {
        store.boardNav = boardsToNav(activeWorkspace.boards)
      }
      
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
      
      // Update store
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        boards: w.boards.filter(b => b.id !== id)
      }))
      
      // Update active board if needed
      if (store.activeBoardId === id) {
        const activeWorkspace = store.workspaces.find(w => w.id === store.activeWorkspaceId)
        store.activeBoardId = activeWorkspace?.boards[0]?.id || null
      }
      
      // Update board navigation
      const activeWorkspace = store.workspaces.find(w => w.id === store.activeWorkspaceId)
      if (activeWorkspace) {
        store.boardNav = boardsToNav(activeWorkspace.boards)
      }
    } catch (error) {
      console.error('Failed to delete board:', error)
      throw error
    }
  },

  // Post operations with store integration
  createPostAndUpdateStore: async (
    brandId: string,
    boardId: string,
    postData: any
  ) => {
    try {
      const post = await postApi.createPost({
        brand_id: brandId,
        board_id: boardId,
        ...postData
      })
      
      const store = useFeedbirdStore.getState()
      
      // Update store
      store.workspaces = store.workspaces.map(w => ({
        ...w,
        brand: w.brand && w.brand.id === brandId ? {
          ...w.brand,
          contents: [...w.brand.contents, {
            id: post.id,
            brandId: post.brand_id,
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
        } : w.brand
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
        brand: w.brand ? {
          ...w.brand,
          contents: w.brand.contents.map(p => 
            p.id === id ? { ...p, ...updates } : p
          )
        } : w.brand
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
        brand: w.brand ? {
          ...w.brand,
          contents: w.brand.contents.map(p => 
            p.id === postId ? { 
              ...p, 
              blocks: result.post.blocks,
              updatedAt: new Date(result.post.updated_at)
            } : p
          )
        } : w.brand
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
        brand: w.brand ? {
          ...w.brand,
          contents: w.brand.contents.filter(p => p.id !== id)
        } : w.brand
      }))
      // Trigger store update for listeners
      useFeedbirdStore.setState({ workspaces: store.workspaces });
    } catch (error) {
      console.error('Failed to delete post:', error)
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

export { ApiError } 