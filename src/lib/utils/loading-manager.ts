import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  loadingMessage: string | null;
  operationCount: number;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  loadingMessage: null,
  operationCount: 0,
  startLoading: (message = 'Loading...') =>
    set((state) => ({
      isLoading: true,
      loadingMessage: message,
      operationCount: state.operationCount + 1,
    })),
  stopLoading: () =>
    set((state) => ({
      operationCount: Math.max(0, state.operationCount - 1),
      isLoading: state.operationCount > 1,
      loadingMessage: state.operationCount > 1 ? state.loadingMessage : null,
    })),
}));

export async function withLoading<T>(
  operation: () => Promise<T>,
  message?: string
): Promise<T> {
  const { startLoading, stopLoading } = useLoadingStore.getState();
  
  try {
    startLoading(message);
    return await operation();
  } finally {
    stopLoading();
  }
}

// Helper function to track multiple concurrent operations
export async function withLoadingGroup<T>(
  operations: Array<() => Promise<T>>,
  message?: string
): Promise<T[]> {
  const { startLoading, stopLoading } = useLoadingStore.getState();
  
  try {
    startLoading(message);
    return await Promise.all(operations.map(async (op) => {
      try {
        return await op();
      } catch (error) {
        console.error('Operation failed:', error);
        throw error;
      }
    }));
  } finally {
    stopLoading();
  }
}

// Helper function for operations that need to show progress
export async function withLoadingProgress<T>(
  operation: (updateProgress: (progress: number) => void) => Promise<T>,
  message?: string
): Promise<T> {
  const { startLoading, stopLoading } = useLoadingStore.getState();
  
  try {
    startLoading(message);
    return await operation((progress) => {
      // Update loading message with progress
      startLoading(`${message || 'Loading...'} (${Math.round(progress)}%)`);
    });
  } finally {
    stopLoading();
  }
} 