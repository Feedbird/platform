'use client';
import { Service } from '@/lib/supabase/interfaces';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/store';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ServicesContextType {
  // Current service list
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;

  // Refetch functions (workspace-aware)
  refetchServices: () => Promise<void>;
  invalidateServices: () => Promise<void>;

  // Currently active/editing service
  activeService: Service | null;
  setActiveService: React.Dispatch<React.SetStateAction<Service | null>>;

  // Workspace context
  activeWorkspaceId: string | null;
}

const ServicesContext = createContext<ServicesContextType | undefined>(
  undefined
);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [activeService, setActiveService] = useState<Service | null>(null);

  // Get workspace ID from store
  const { activeWorkspaceId } = useWorkspaceStore();

  const queryClient = useQueryClient();

  // Workspace-aware refetch function
  const refetchServices = async () => {
    if (!activeWorkspaceId) {
      console.warn('No active workspace - cannot refetch services');
      return;
    }

    await queryClient.refetchQueries({
      queryKey: ['services', activeWorkspaceId],
    });
  };

  // Workspace-aware invalidate function
  const invalidateServices = async () => {
    if (!activeWorkspaceId) {
      console.warn('No active workspace - cannot invalidate services');
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ['services', activeWorkspaceId],
    });
  };

  return (
    <ServicesContext.Provider
      value={{
        services,
        setServices,
        activeService,
        setActiveService,
        refetchServices,
        invalidateServices,
        activeWorkspaceId,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}
