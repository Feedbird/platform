'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import LandingPage from '@/app/landing/page';
import { AuthenticatedLayout } from './authenticated-layout';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('AuthGuard state:', { isLoaded, isSignedIn, userId: user?.id, pathname })
    
    if (isLoaded) {
      // If user is signed in and trying to access landing page, redirect to home
      if (isSignedIn && pathname === '/landing') {
        console.log('AuthGuard: Redirecting signed-in user from landing to home');
        router.replace('/');
        return;
      }
      // If user is not signed in and trying to access protected routes, redirect to landing
      else if (!isSignedIn && pathname !== '/landing') {
        console.log('AuthGuard: Redirecting unsigned user to landing');
        router.replace('/landing');
        return;
      }
    }
  }, [isLoaded, isSignedIn, pathname, router, user]);

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not signed in, show landing page
  if (!isSignedIn) {
    console.log('AuthGuard: User not signed in, showing landing page');
    return <LandingPage />;
  }

  // If user is signed in, show the main app with authenticated layout
  // Only render authenticated layout if we have a user object and are on a protected route
  if (isSignedIn && user && pathname !== '/landing') {
    console.log('AuthGuard: User signed in, showing authenticated layout');
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }
  
  // If user is signed in but we're on landing page, show loading until redirect completes
  if (isSignedIn && pathname === '/landing') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Fallback - should not reach here
  console.log('AuthGuard: Fallback case');
  return <LandingPage />;
} 