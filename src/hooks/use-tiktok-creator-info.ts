"use client";

import { useState, useEffect } from 'react';
import type { TikTokCreatorInfo } from '@/lib/social/platforms/platform-types';

interface UseTikTokCreatorInfoOptions {
  pageId: string | null;
  enabled?: boolean;
}

interface UseTikTokCreatorInfoReturn {
  creatorInfo: TikTokCreatorInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTikTokCreatorInfo({ 
  pageId, 
  enabled = true 
}: UseTikTokCreatorInfoOptions): UseTikTokCreatorInfoReturn {
  const [creatorInfo, setCreatorInfo] = useState<TikTokCreatorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatorInfo = async () => {
    if (!pageId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social/tiktok/creator-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data: TikTokCreatorInfo = await response.json();
      setCreatorInfo(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch creator info';
      setError(errorMessage);
      console.error('[useTikTokCreatorInfo] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatorInfo();
  }, [pageId, enabled]);

  return {
    creatorInfo,
    loading,
    error,
    refetch: fetchCreatorInfo,
  };
}
