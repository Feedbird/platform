// utils.ts
// Shared utility functions for analytics sync

import { supabase } from "./supabase-client.ts";

export interface SocialAccount {
  id: string;
  platform: string;
  refresh_token: string;
}

export interface SocialPage {
  id: string;
  account_id: string;
  platform: string;
  page_id: string;
  name: string;
  auth_token: string;
  auth_token_expires_at: string | null;
  connected: boolean;
}

/**
 * Fetch all connected social pages that need analytics sync
 */
export async function fetchSocialPages(): Promise<SocialPage[]> {
  const { data: pages, error } = await supabase
    .from('social_pages')
    .select('id, account_id, platform, page_id, name, auth_token, auth_token_expires_at, connected')
    .eq('connected', true)
    .not('auth_token', 'is', null);

  if (error) {
    console.error('Error fetching social pages:', error);
    throw new Error(`Failed to fetch social pages: ${error.message}`);
  }

  return pages || [];
}
/**
 * Fetch social account with refresh token from database
 */
export async function fetchSocialAccount(accountId: string): Promise<SocialAccount | null> {
  const { data, error } = await supabase
    .from('social_accounts')
    .select('id, platform, refresh_token')
    .eq('id', accountId)
    .single();

  if (error) {
    console.error('Error fetching social account:', error);
    return null;
  }

  return data;
}

/**
 * Check if snapshot already exists for today
 */
export async function snapshotExists(pageId: string, date: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('account_analytics_snapshots')
    .select('*', { count: 'exact', head: true })
    .eq('page_id', pageId)
    .eq('snapshot_date', date);

  if (error) {
    console.error('Error checking snapshot:', error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * Save analytics snapshot to database
 */
export async function saveSnapshot(snapshot: any): Promise<void> {
  const { error } = await supabase
    .from('account_analytics_snapshots')
    .upsert(snapshot, {
      onConflict: 'page_id,snapshot_date'
    });

  if (error) {
    console.error('Error saving snapshot:', error);
    throw new Error(`Failed to save snapshot: ${error.message}`);
  }
}


