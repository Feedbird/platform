-- Migration: add_platform_post_ids_to_posts
-- Date: 2025-09-01T13:40:53.453Z
-- Description: add_platform_post_ids_to_posts

-- Add platform_post_ids column to posts table to store published post IDs from social platforms
-- This will store a JSONB object like: {"tiktok": "share_id_123", "facebook": "post_id_456", "linkedin": "urn:li:share:678"}
ALTER TABLE posts ADD COLUMN IF NOT EXISTS platform_post_ids JSONB DEFAULT '{}';

-- Add a comment to document the column purpose
COMMENT ON COLUMN posts.platform_post_ids IS 'Stores published post IDs from social platforms as JSONB. Format: {"platform": "post_id"}';

-- Create an index on the platform_post_ids column for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_platform_post_ids ON posts USING GIN (platform_post_ids);

-- Migration completed successfully

