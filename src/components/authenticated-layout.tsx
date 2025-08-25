'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import FeedbirdProvider from "@/lib/providers/feedbird-provider";
import { LoadingProvider } from '@/lib/providers/loading-provider';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Toaster } from "@/components/ui/sonner";
import { TopProgressBar } from "@/components/layout/top-progress-bar";
import { DynamicTitle } from "@/components/layout/dynamic-title";
import PortalRoot from '@/components/portal-root/portal-root';
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();
  const workspacesLoading = useFeedbirdStore(s => s.workspacesLoading);
  const workspacesInitialized = useFeedbirdStore(s => s.workspacesInitialized);

  // Debug logging
  console.log('AuthenticatedLayout state:', { isLoaded, isSignedIn, userId: user?.id });

  // Show loading while authentication is being determined
  if (!isLoaded || !isSignedIn || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            {!isLoaded ? 'Loading...' : 'Authenticating...'}
          </p>
        </div>
      </div>
    );
  }

  // Wait for workspace data to load after auth
  if (!workspacesInitialized || workspacesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading workspaces…</p>
        </div>
      </div>
    );
  }

  // Only render app layout when user is authenticated
  return (
    <LoadingProvider>
      <SidebarProvider>
        <FeedbirdProvider>
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          <DynamicTitle />
          <AppSidebar />
          <SidebarInset>
            {!(pathname?.startsWith('/analytics') || pathname?.startsWith('/messages') || pathname?.includes('/analytics') || pathname?.includes('/messages')) && <AppHeader />}
            <Suspense fallback={null}>
              <main
                className={`flex w-full ${
                  pathname?.startsWith('/analytics') || pathname?.startsWith('/messages') || pathname?.includes('/analytics') || pathname?.includes('/messages')
                    ? 'h-[100vh]'
                    : 'h-[calc(100vh-48px)]'
                } bg-background`}
              >
                {children}
              </main>
            </Suspense>
          </SidebarInset>
        </FeedbirdProvider>
      </SidebarProvider>
      <PortalRoot/>
      <LoadingSpinner />
      <Toaster 
        position="bottom-right"
        expand={true}
        richColors
        closeButton
      />
    </LoadingProvider>
  );
} 