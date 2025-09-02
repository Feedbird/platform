import { useState, useCallback } from 'react'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
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
  
  const store = useFeedbirdStore()

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
    return withLoading('createWorkspace', () => store.addWorkspace(name, email, logo))
  }, [store, withLoading])

  const updateWorkspace = useCallback(async (id: string, updates: { name?: string; logo?: string }) => {
    return withLoading('updateWorkspace', () => storeApi.updateWorkspaceAndUpdateStore(id, updates))
  }, [withLoading])

  const deleteWorkspace = useCallback(async (id: string) => {
    return withLoading('deleteWorkspace', () => store.removeWorkspace(id))
  }, [store, withLoading])

  // Brand operations
  const createBrand = useCallback(async (
    name: string,
    logo?: string,
    styleGuide?: any,
    link?: string,
    voice?: string,
    prefs?: string
  ) => {
    return withLoading('createBrand', () => store.addBrand(name, logo, styleGuide, link, voice, prefs))
  }, [store, withLoading])

  const updateBrand = useCallback(async (id: string, updates: any) => {
    return withLoading('updateBrand', () => store.updateBrand(id, updates))
  }, [store, withLoading])

  const deleteBrand = useCallback(async (id: string) => {
    return withLoading('deleteBrand', () => store.removeBrand(id))
  }, [store, withLoading])

  // Board operations
  const createBoard = useCallback(async (
    name: string,
    description?: string,
    image?: string,
    color?: string,
    rules?: any
  ) => {
    console.log("createBoard", name, description, image, color, rules);
    return withLoading('createBoard', () => store.addBoard(name, description, image, color, rules))
  }, [store, withLoading])

  const updateBoard = useCallback(async (id: string, updates: any) => {
    return withLoading('updateBoard', () => store.updateBoard(id, updates))
  }, [store, withLoading])

  const deleteBoard = useCallback(async (id: string) => {
    return withLoading('deleteBoard', () => store.removeBoard(id))
  }, [store, withLoading])

  // Post operations
  const createPost = useCallback(async (
    workspaceId: string,
    board_id: string,
    postData: any
  ) => {
    const userEmail = store.user?.email
    if (!userEmail) throw new Error('No user email available')
    return withLoading('createPost', () => storeApi.createPostAndUpdateStore(workspaceId, board_id, postData, userEmail))
  }, [store.user?.email, withLoading])

  const updatePost = useCallback(async (id: string, updates: any) => {
    return withLoading('updatePost', () => storeApi.updatePostAndUpdateStore(id, updates))
  }, [withLoading])

  const deletePost = useCallback(async (id: string) => {
    return withLoading('deletePost', () => storeApi.deletePostAndUpdateStore(id))
  }, [withLoading])

  // User operations
  const createUser = useCallback(async (userData: {
    email: string
    first_name?: string
    last_name?: string
    image_url?: string
  }) => {
    console.log('createUser', userData);
    return withLoading('createUser', () => userApi.createUser(userData))
  }, [withLoading])

  const updateUser = useCallback(async (
    params: { id?: string; email?: string },
    updates: {
      first_name?: string
      last_name?: string
      image_url?: string
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