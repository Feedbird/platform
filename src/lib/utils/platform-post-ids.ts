import { socialApiService } from '@/lib/api/social-api-service';

/**
 * Updates the platform post ID for a specific post and platform
 * 
 * This handles multiple accounts for the same platform by creating unique keys
 * like "tiktok_page1", "tiktok_page2", "facebook_page1", etc.
 * 
 * Complete flow example:
 * 1. User publishes to TikTok account 1 → saves as "tiktok_page1": "share_id_123"
 * 2. User publishes to TikTok account 2 → saves as "tiktok_page2": "share_id_456"  
 * 3. User publishes to Facebook page → saves as "facebook_page1": "post_id_789"
 * 
 * Usage example:
 * ```typescript
 * // After successful publishing to TikTok account 1
 * await updatePlatformPostId(postId, 'tiktok', 'share_id_123', 'page_id_1');
 * 
 * // After successful publishing to TikTok account 2  
 * await updatePlatformPostId(postId, 'tiktok', 'share_id_456', 'page_id_2');
 * 
 * // After successful publishing to Facebook page
 * await updatePlatformPostId(postId, 'facebook', 'post_id_789', 'page_id_3');
 * ```
 * 
 * @param postId - The internal post ID
 * @param platform - The social platform name (e.g., 'tiktok', 'facebook')
 * @param platformPostId - The published post ID from the platform
 * @param pageId - The specific social page/account ID to distinguish between multiple accounts
 */
export async function updatePlatformPostId(
  postId: string,
  platform: string,
  platformPostId: string,
  pageId: string
): Promise<void> {
  try {
    // Get current post data using API service
    const currentPost = await socialApiService.getPost(postId);

    // Update or add the platform post ID for the specific page
    const currentIds = currentPost?.platform_post_ids || {};
    
    // Create platform key that includes page ID to distinguish between multiple accounts
    const platformKey = `${platform}_${pageId}`;
    
    const updatedIds = {
      ...currentIds,
      [platformKey]: platformPostId
    };

    // Update the post using API service
    await socialApiService.updatePost(postId, {
      platform_post_id: JSON.stringify(updatedIds),
      published_at: new Date().toISOString()
    });

    console.log(`Updated ${platform} post ID for post ${postId} and page ${pageId}: ${platformPostId}`);
  } catch (error) {
    console.error('Failed to update platform post ID:', error);
    throw error;
  }
}
