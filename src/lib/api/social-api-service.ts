/**
 * API service for social platform operations
 * This service provides methods to interact with social accounts, pages, and posts
 * through API endpoints instead of direct Supabase access
 */

export interface SocialPageData {
  id: string;
  account_id: string;
  auth_token: string;
  auth_token_expires_at: string | null;
  metadata: any;
  platform: string;
  name: string;
  page_id: string;
  connected: boolean;
  status: string;
}

export interface SocialAccountData {
  id: string;
  auth_token: string;
  refresh_token: string | null;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  token_issued_at: string | null;
  metadata: any;
  platform: string;
  name: string;
  account_id: string;
  connected: boolean;
  status: string;
}

export interface PostUpdateData {
  status?: string;
  published_at?: string;
  platform_post_id?: string;
  error_message?: string;
}

class SocialApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Get social page details including tokens
   */
  async getSocialPage(pageId: string): Promise<SocialPageData> {
    const response = await fetch(`${this.baseUrl}/api/social-page/${pageId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch social page');
    }

    return response.json();
  }

  /**
   * Update social page tokens
   */
  async updateSocialPage(pageId: string, updateData: Partial<SocialPageData>): Promise<SocialPageData> {
    const response = await fetch(`${this.baseUrl}/api/social-page/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update social page');
    }

    return response.json();
  }

  /**
   * Get social account details including tokens
   */
  async getSocialAccount(accountId: string): Promise<SocialAccountData> {
    const response = await fetch(`${this.baseUrl}/api/social-account/${accountId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch social account');
    }

    return response.json();
  }

  /**
   * Update social account tokens
   */
  async updateSocialAccount(accountId: string, updateData: Partial<SocialAccountData>): Promise<SocialAccountData> {
    const response = await fetch(`${this.baseUrl}/api/social-account/${accountId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update social account');
    }

    return response.json();
  }

  /**
   * Get post details
   */
  async getPost(postId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/posts/${postId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch post');
    }

    return response.json();
  }

  /**
   * Update post status
   */
  async updatePost(postId: string, updateData: PostUpdateData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update post');
    }

    return response.json();
  }

  /**
   * Update social pages tokens for an account (bulk update)
   */
  async updateSocialPagesForAccount(accountId: string, updateData: Partial<SocialPageData>): Promise<void> {
    // This would require a new API endpoint for bulk updates
    // For now, we'll handle this in the platform scripts by updating each page individually
    throw new Error('Bulk update not implemented yet - use individual page updates');
  }
}

// Export singleton instance
export const socialApiService = new SocialApiService();
