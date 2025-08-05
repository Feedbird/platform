'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import LandingPage from '@/app/landing/page';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('AuthGuard state:', { isLoaded, isSignedIn, userId: user?.id, pathname })
    
    if (isLoaded) {
      // If user is signed in and trying to access landing page, redirect to home
      if (isSignedIn && pathname === '/landing') {
        router.replace('/');
      }
      // If user is not signed in and trying to access protected routes, redirect to landing
      else if (!isSignedIn && pathname !== '/landing') {
        router.replace('/landing');
      }
    }
  }, [isLoaded, isSignedIn, pathname, router, user]);

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user is not signed in, show landing page
  if (!isSignedIn) {
    return <LandingPage />;
  }

  // If user is signed in, show the main app
  return <>{children}</>;
} 