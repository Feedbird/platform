import { create } from 'zustand';

export interface LoadingOperation {
  id: string;
  message: string;
  progress?: number;
  startTime: Date;
}

interface LoadingState {
  isLoading: boolean;
  operations: Map<string, LoadingOperation>;
  currentMessage: string | null;
  
  // Actions
  startOperation: (id: string, message: string) => void;
  updateOperation: (id: string, progress: number) => void;
  completeOperation: (id: string) => void;
  clearOperations: () => void;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  isLoading: false,
  operations: new Map(),
  currentMessage: null,

  startOperation: (id: string, message: string) => {
    set(state => {
      const operations = new Map(state.operations);
      operations.set(id, {
        id,
        message,
        startTime: new Date()
      });

      return {
        operations,
        isLoading: true,
        currentMessage: message
      };
    });
  },

  updateOperation: (id: string, progress: number) => {
    set(state => {
      const operations = new Map(state.operations);
      const operation = operations.get(id);
      
      if (operation) {
        operations.set(id, {
          ...operation,
          progress
        });
      }

      return {
        operations,
        currentMessage: operation ? `${operation.message} (${Math.round(progress)}%)` : state.currentMessage
      };
    });
  },

  completeOperation: (id: string) => {
    set(state => {
      const operations = new Map(state.operations);
      operations.delete(id);

      // Update loading state and message based on remaining operations
      const remainingOps = Array.from(operations.values());
      const latestOp = remainingOps[remainingOps.length - 1];

      return {
        operations,
        isLoading: operations.size > 0,
        currentMessage: latestOp?.message ?? null
      };
    });
  },

  clearOperations: () => {
    set({
      isLoading: false,
      operations: new Map(),
      currentMessage: null
    });
  }
}));

// Helper function to wrap async operations with loading state
export async function withLoading<T>(
  operation: () => Promise<T>,
  message: string
): Promise<T> {
  const operationId = crypto.randomUUID();
  const { startOperation, completeOperation } = useLoadingStore.getState();

  try {
    startOperation(operationId, message);
    return await operation();
  } finally {
    completeOperation(operationId);
  }
}

// Helper function for operations with progress
export async function withLoadingProgress<T>(
  operation: (updateProgress: (progress: number) => void) => Promise<T>,
  message: string
): Promise<T> {
  const operationId = crypto.randomUUID();
  const { startOperation, updateOperation, completeOperation } = useLoadingStore.getState();

  try {
    startOperation(operationId, message);
    return await operation(progress => updateOperation(operationId, progress));
  } finally {
    completeOperation(operationId);
  }
} 