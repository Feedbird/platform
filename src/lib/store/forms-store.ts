import { create } from "zustand";
import { Form, Service } from "../supabase/interfaces";
import { ApiResponse, formsApi, servicesApi } from "../api/api-service";

interface FormStoreState {
  getFormsByWorkspaceId: (workspaceId: string) => Promise<ApiResponse<Form[]>>;
  getFormById: (id: string) => Promise<ApiResponse<Form>>;
  createInitialForm: (
    creatorEmail: string,
    workspaceId: string
  ) => Promise<Form>;
  services: Service[];
  fetchServices: (workspaceId: string) => void;
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
  services: [],
  fetchServices: async (workspaceId: string) => {
    try {
      const services = await servicesApi.fetchAllServices(workspaceId);
      console.log(`✅ Services fetched successfully`);
      set({ services: services.data || [] });
    } catch (e) {
      throw e;
    }
  },
}));
