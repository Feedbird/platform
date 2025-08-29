import { create } from "zustand";
import { Form } from "../supabase/client";
import { formsApi } from "../api/api-service";

interface FormStoreState {
  workspaceForms: Form[];
  setWorkspaceForms: (forms: Form[]) => void;
  getFormById: (id: string) => Promise<{ data: Form }>;
  createInitialForm: (
    creatorEmail: string,
    workspaceId: string
  ) => Promise<Form>;
}

export const useFormStore = create<FormStoreState>((set, get) => ({
  workspaceForms: [],
  setWorkspaceForms: (forms) => set({ workspaceForms: forms }),
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
