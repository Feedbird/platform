"use client";

import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/lib/store';

export interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'SECRET';
  pin_count?: number;
  follower_count?: number;
  media?: {
    image_cover_url?: string;
  };
}

interface UsePinterestBoardsOptions {
  pageId: string | null;
  enabled?: boolean;
}

interface UsePinterestBoardsReturn {
  boards: PinterestBoard[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePinterestBoards({ 
  pageId, 
  enabled = true 
}: UsePinterestBoardsOptions): UsePinterestBoardsReturn {
  const [boards, setBoards] = useState<PinterestBoard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const ws = useWorkspaceStore((s) => s.getActiveWorkspace());

  const fetchBoards = async () => {
    if (!pageId || !enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Find the Pinterest page
      const pinterestPage = ws?.socialPages?.find(page => 
        page.id === pageId && page.platform === 'pinterest'
      );
      
      if (!pinterestPage) {
        throw new Error('Pinterest account not found');
      }

      // Call the Pinterest boards API
      const response = await fetch('/api/social/pinterest/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: pinterestPage
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Pinterest boards');
      }

      const data = await response.json();
      setBoards(data.boards || []);
    } catch (err) {
      console.error('Error fetching Pinterest boards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled && pageId) {
      fetchBoards();
    }
  }, [pageId, enabled]);

  return {
    boards,
    loading,
    error,
    refetch: fetchBoards
  };
}
