/**
 * Type definitions for API requests and responses
 */

import type { NotificationSettings } from '@/lib/store/types';
import type { SocialPage } from '@/lib/social/platforms/platform-types';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * Invite API response structure
 */
export interface InviteResponse {
  message: string;
  details?: string;
  warning?: boolean;
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  error: string;
  details?: unknown;
  message?: string;
}

/**
 * API error with status code
 * Note: This is the interface for error responses, not the class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Workspace member structure
 */
export interface WorkspaceMember {
  email: string;
  firstName?: string;
  imageUrl?: string;
  role?: 'admin' | 'client' | 'team';
  accept?: boolean;
}

/**
 * Get workspace members response
 */
export interface GetWorkspaceMembersResponse {
  users: WorkspaceMember[];
}

/**
 * Update member role response
 */
export interface UpdateMemberRoleResponse {
  message: string;
}

/**
 * Channel message structure (with author info)
 */
export interface ChannelMessageWithAuthor {
  authorName?: string;
  authorImageUrl?: string;
}

/**
 * Social account structure
 */
export interface SocialAccount {
  id: string;
  platform: string;
  name: string;
  accountId: string;
  connected: boolean;
  status: string;
  socialPages?: SocialPage[];
}

/**
 * Activity types
 */
export type ActivityType =
  | 'revision_request'
  | 'revised'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'failed_publishing'
  | 'comment'
  | 'workspace_invited_sent'
  | 'board_invited_sent'
  | 'workspace_invited_accepted'
  | 'workspace_invited_declined'
  | 'workspace_access_requested';

/**
 * Activity metadata
 */
export interface ActivityMetadata {
  [key: string]: unknown;
}

/**
 * Comment structure
 */
export interface Comment {
  id: string;
  text: string;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
  parentId?: string;
  revisionRequested?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Post comment data
 */
export interface PostCommentData {
  postId: string;
  text: string;
  parentId?: string;
  revisionRequested?: boolean;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
}

/**
 * Block comment data
 */
export interface BlockCommentData {
  postId: string;
  blockId: string;
  text: string;
  parentId?: string;
  revisionRequested?: boolean;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
}

/**
 * Version comment data
 */
export interface VersionCommentData {
  postId: string;
  blockId: string;
  versionId: string;
  text: string;
  parentId?: string;
  revisionRequested?: boolean;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
  rect?: { x: number; y: number; w: number; h: number };
}

/**
 * Update user payload
 */
export interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  unreadMsg?: string[];
  unreadNotification?: string[];
  notificationSettings?: NotificationSettings;
  defaultBoardRules?: Record<string, unknown>;
}

/**
 * Create user payload
 */
export interface CreateUserPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  defaultBoardRules?: Record<string, unknown>;
}

 