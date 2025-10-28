import { useState, useCallback } from 'react'
import { useUserStore, useWorkspaceStore } from '@/lib/store'
import { storeApi, userApi } from '@/lib/api/api-service'
import { ApiError } from '@/lib/api/api-service'

interface LoadingState {
  [key: string]: boolean
}

interface ErrorState {
  [key: string]: string | null
}

export function useApiOperations() {
  const [loading, setLoading] = useState<LoadingState>({})
  const [errors, setErrors] = useState<ErrorState>({})
  
  const workspaceStore = useWorkspaceStore()

  // Helper function to manage loading states
  const withLoading = useCallback(async <T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    setLoading(prev => ({ ...prev, [operation]: true }))
    setErrors(prev => ({ ...prev, [operation]: null }))
    
    try {
      const result = await fn()
      return result
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred'
      
      setErrors(prev => ({ ...prev, [operation]: errorMessage }))
      throw error
    } finally {
      setLoading(prev => ({ ...prev, [operation]: false }))
    }
  }, [])

  // Workspace operations
  const createWorkspace = useCallback(async (name: string, email: string, logo?: string) => {
    return withLoading('createWorkspace', () => workspaceStore.addWorkspace(name, email, logo))
  }, [workspaceStore, withLoading])

  const updateWorkspace = useCallback(async (id: string, updates: { name?: string; logo?: string }) => {
    return withLoading('updateWorkspace', () => storeApi.updateWorkspaceAndUpdateStore(id, updates))
  }, [withLoading])

  const deleteWorkspace = useCallback(async (id: string) => {
    return withLoading('deleteWorkspace', () => workspaceStore.removeWorkspace(id))
  }, [workspaceStore, withLoading])

  // Brand operations
  const createBrand = useCallback(async (
    name: string,
    logo?: string,
    styleGuide?: any,
    link?: string,
    voice?: string,
    prefs?: string
  ) => {
    return withLoading('createBrand', () => workspaceStore.addBrand(name, logo, styleGuide, link, voice, prefs))
  }, [workspaceStore, withLoading])

  const updateBrand = useCallback(async (id: string, updates: any) => {
    return withLoading('updateBrand', () => workspaceStore.updateBrand(id, updates))
  }, [workspaceStore, withLoading])

  const deleteBrand = useCallback(async (id: string) => {
    return withLoading('deleteBrand', () => workspaceStore.removeBrand(id))
  }, [workspaceStore, withLoading])

  // Board operations
  const createBoard = useCallback(async (
    name: string,
    description?: string,
    image?: string,
    color?: string,
    rules?: any
  ) => {
    console.log("createBoard", name, description, image, color, rules);
    return withLoading('createBoard', () => workspaceStore.addBoard(name, description, image, color, rules))
  }, [workspaceStore, withLoading])

  const updateBoard = useCallback(async (id: string, updates: any) => {
    return withLoading('updateBoard', () => workspaceStore.updateBoard(id, updates))
  }, [workspaceStore, withLoading])

  const deleteBoard = useCallback(async (id: string) => {
    return withLoading('deleteBoard', () => workspaceStore.removeBoard(id))
  }, [workspaceStore, withLoading])

  // Post operations
  const createPost = useCallback(async (
    workspaceId: string,
    boardId: string,
    postData: any
  ) => {
    const userEmail = useUserStore.getState().user?.email
    if (!userEmail) throw new Error('No user email available')
    return withLoading('createPost', () => storeApi.createPostAndUpdateStore(workspaceId, boardId, postData, userEmail))
  }, [useUserStore.getState().user?.email, withLoading])

  const updatePost = useCallback(async (id: string, updates: any) => {
    return withLoading('updatePost', () => storeApi.updatePostAndUpdateStore(id, updates))
  }, [withLoading])

  const deletePost = useCallback(async (id: string) => {
    return withLoading('deletePost', () => storeApi.deletePostAndUpdateStore(id))
  }, [withLoading])

  // User operations
  const createUser = useCallback(async (userData: {
    email: string
    firstName?: string
    lastName?: string
    imageUrl?: string
  }) => {
    console.log('createUser', userData);
    return withLoading('createUser', () => userApi.createUser(userData))
  }, [withLoading])

  const updateUser = useCallback(async (
    params: { id?: string; email?: string },
    updates: {
      firstName?: string
      lastName?: string
      imageUrl?: string
    }
  ) => {
    return withLoading('updateUser', () => userApi.updateUser(params, updates))
  }, [withLoading])

  const deleteUser = useCallback(async (params: { id?: string; email?: string }) => {
    return withLoading('deleteUser', () => userApi.deleteUser(params))
  }, [withLoading])

  // Loading state getters
  const isLoading = useCallback((operation: string) => loading[operation] || false, [loading])
  const getError = useCallback((operation: string) => errors[operation] || null, [errors])
  const clearError = useCallback((operation: string) => {
    setErrors(prev => ({ ...prev, [operation]: null }))
  }, [])

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    // Operations
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    createBrand,
    updateBrand,
    deleteBrand,
    createBoard,
    updateBoard,
    deleteBoard,
    createPost,
    updatePost,
    deletePost,
    createUser,
    updateUser,
    deleteUser,
    
    // Loading and error states
    loading,
    errors,
    isLoading,
    getError,
    clearError,
    clearAllErrors,
  }
} 