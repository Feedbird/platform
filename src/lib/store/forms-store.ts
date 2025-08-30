import { create } from "zustand";
import { Form } from "../supabase/client";
import { ApiResponse, formsApi } from "../api/api-service";

interface FormStoreState {
  getFormsByWorkspaceId: (workspaceId: string) => Promise<ApiResponse<Form[]>>;
  getFormById: (id: string) => Promise<ApiResponse<Form>>;
  createInitialForm: (
    creatorEmail: string,
    workspaceId: string
  ) => Promise<Form>;
}

export const useFormStore = create<FormStoreState>((set, get) => ({
  getFormsByWorkspaceId: async (workspaceId: string) => {
    return formsApi.getFormsByWorkspaceId(workspaceId);
  },
  getFormById: async (id: string) => {
    const form = formsApi.getFormById(id);
    if (!form) {
      throw new Error(`Form with id ${id} not found`);
    }
    return form;
  },
  createInitialForm: async (creatorEmail: string, workspaceId: string) => {
    try {
      const form = await formsApi.createInitialForm(creatorEmail, workspaceId);
      console.log(`✅ Initial form created successfully`);
      return form;
    } catch (error) {
      console.error("❌ Failed to create initial form:", error);
      throw error;
    }
  },
}));
