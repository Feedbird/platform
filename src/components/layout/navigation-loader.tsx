'use client';

import { ProgressLink } from './progress-link';
import { useRouter } from 'next/navigation';
import { useAsyncLoading } from '@/hooks/use-async-loading';
import { ComponentProps, forwardRef, useCallback } from 'react';
import { LinkProps } from 'next/link';

interface LoadingLinkProps extends LinkProps {
  loadingText?: string;
  className?: string;
  children: React.ReactNode;
}

export const LoadingLink = forwardRef<HTMLAnchorElement, LoadingLinkProps>(
  ({ loadingText = "Loading page...", onClick, href, ...props }, ref) => {
    const { showLoading } = useAsyncLoading();

    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
      // Only show loading for actual navigation (not for # links or external links)
      const url = href?.toString() || '';
      
      if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        // Don't show loading for anchor links or special protocols
        onClick?.(e);
        return;
      }

      if (url.startsWith('http') && !url.includes(window.location.hostname)) {
        // Don't show loading for external links
        onClick?.(e);
        return;
      }

      // Show loading for internal navigation
      try {
        showLoading(loadingText);
      } catch (error) {
        console.error('Failed to show loading state:', error);
      }
      
      // Call original onClick if provided
      onClick?.(e);
    }, [showLoading, loadingText, onClick, href]);

    return <ProgressLink ref={ref} {...props} href={href} onClick={handleClick} />;
  }
);

LoadingLink.displayName = 'LoadingLink';

// Hook for programmatic navigation with loading
export function useLoadingRouter() {
  const router = useRouter();
  const { showLoading } = useAsyncLoading();

  const loadingPush = useCallback((href: string, loadingText = "Loading page...") => {
    try {
      showLoading(loadingText);
      router.push(href);
    } catch (error) {
      console.error('Failed to navigate with loading:', error);
      // Fallback to regular navigation
      router.push(href);
    }
  }, [router, showLoading]);

  const loadingReplace = useCallback((href: string, loadingText = "Loading page...") => {
    try {
      showLoading(loadingText);
      router.replace(href);
    } catch (error) {
      console.error('Failed to replace with loading:', error);
      // Fallback to regular navigation
      router.replace(href);
    }
  }, [router, showLoading]);

  return { 
    push: loadingPush, 
    replace: loadingReplace,
    back: router.back,
    forward: router.forward,
    refresh: router.refresh,
  };
} 