import { create } from "zustand";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { storeApi } from "@/lib/api/api-service";

export type UploadStatus = "uploading" | "processing" | "done" | "error";

export interface GlobalUpload {
  id: string;
  postId: string;
  file: File;
  previewUrl: string;
  progress: number; // 0 - 100
  status: UploadStatus;
}

interface UploadStoreState {
  uploads: GlobalUpload[];
  addUpload: (up: GlobalUpload) => void;
  updateUpload: (id: string, updates: Partial<Omit<GlobalUpload, "id">>) => void;
  removeUpload: (id: string) => void;
  updatePostAfterUpload: (postId: string, blocks: any[]) => Promise<void>;
}

// Simple in-memory store (not persisted)
export const useUploadStore = create<UploadStoreState>((set, get) => ({
  uploads: [],
  addUpload: (up) =>
    set((state) => {
      if (state.uploads.find((u) => u.id === up.id)) return state; // already exists
      return { uploads: [...state.uploads, up] };
    }),
  updateUpload: (id, updates) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      ),
    })),
  removeUpload: (id) =>
    set((state) => {
      const found = state.uploads.find((u) => u.id === id);
      if (found) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return { uploads: state.uploads.filter((u) => u.id !== id) };
    }),
  updatePostAfterUpload: async (postId: string, blocks: any[]) => {
    try {
      // Update post blocks in database using the API service
      await storeApi.updatePostBlocksAndUpdateStore(postId, blocks);
      console.log('✅ Post updated successfully after upload');
    } catch (error) {
      console.error('❌ Failed to update post after upload:', error);
      throw error;
    }
  },
})); 