import { createPersistedStore } from './store-utils';
import { formsApi, servicesApi } from '@/lib/api/api-service';
import type { Form, Service } from '@/lib/supabase/interfaces';

export interface FormsStore {
  // State
  unsavedFormChanges: boolean;
  forms: Form[];
  services: Service[];
  loading: boolean;

  // Forms methods
  setUnsavedFormChanges: (unsaved: boolean) => void;
  getFormsByWorkspaceId: (workspaceId: string) => Promise<Form[]>;
  getFormById: (id: string) => Promise<Form>;
  createInitialForm: (creatorEmail: string, workspaceId: string) => Promise<Form>;
  fetchServices: (workspaceId: string, available?: boolean) => Promise<Service[]>;
  setForms: (forms: Form[]) => void;
  setServices: (services: Service[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useFormStore = createPersistedStore<FormsStore>(
  "forms-store",
  (set, get) => ({
    // State
    unsavedFormChanges: false,
    forms: [],
    services: [],
    loading: false,

    // Forms methods
    setUnsavedFormChanges: (unsaved: boolean) => {
      set(() => ({ unsavedFormChanges: unsaved }));
    },

    getFormsByWorkspaceId: async (workspaceId: string) => {
      try {
        set(() => ({ loading: true }));
        const response = await formsApi.getFormsByWorkspaceId(workspaceId);
        const forms = response.data || [];
        set(() => ({ forms, loading: false }));
        return forms;
      } catch (error) {
        console.error('Failed to fetch forms:', error);
        set(() => ({ loading: false }));
        throw error;
      }
    },

    getFormById: async (id: string) => {
      try {
        set(() => ({ loading: true }));
        const response = await formsApi.getFormById(id);
        const form = response.data;
        set(() => ({ loading: false }));
        return form;
      } catch (error) {
        console.error('Failed to fetch form:', error);
        set(() => ({ loading: false }));
        throw error;
      }
    },

    createInitialForm: async (creatorEmail: string, workspaceId: string) => {
      try {
        set(() => ({ loading: true }));
        const form = await formsApi.createInitialForm(creatorEmail, workspaceId);
        set((state: FormsStore) => ({ 
          forms: [...state.forms, form],
          loading: false 
        }));
        return form;
      } catch (error) {
        console.error('Failed to create form:', error);
        set(() => ({ loading: false }));
        throw error;
      }
    },

    fetchServices: async (workspaceId: string, available?: boolean) => {
      try {
        set(() => ({ loading: true }));
        const response = await servicesApi.fetchAllServices(workspaceId);
        const services = response.data || [];
        set(() => ({ services, loading: false }));
        return services;
      } catch (error) {
        console.error('Failed to fetch services:', error);
        set(() => ({ loading: false }));
        throw error;
      }
    },

    setForms: (forms: Form[]) => {
      set(() => ({ forms }));
    },

    setServices: (services: Service[]) => {
      set(() => ({ services }));
    },

    setLoading: (loading: boolean) => {
      set(() => ({ loading }));
    },
  })
);