-- Migration: create_account_analytics_snapshots
-- Description: Create account analytics snapshots table to store daily account/page metrics from social media platforms

-- Create account_analytics_snapshots table
CREATE TABLE IF NOT EXISTS account_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  page_id UUID NOT NULL REFERENCES social_pages(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  
  -- Snapshot metadata
  snapshot_date DATE NOT NULL,
  snapshot_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Standardized account metrics
  follower_count BIGINT DEFAULT 0,
  following_count BIGINT DEFAULT 0,
  post_count BIGINT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_likes BIGINT DEFAULT 0,
  
  -- Engagement metrics
  page_impressions BIGINT DEFAULT 0,
  page_reach BIGINT DEFAULT 0,
  page_engagement BIGINT DEFAULT 0,
  
  -- Platform-specific raw data
  raw_metrics JSONB DEFAULT '{}', -- Full platform response
  demographic_data JSONB DEFAULT '{}', -- Age, gender, location breakdown (if available)
  platform_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_account_snapshot UNIQUE (page_id, snapshot_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_account_analytics_page_id ON account_analytics_snapshots(page_id);
CREATE INDEX IF NOT EXISTS idx_account_analytics_account_id ON account_analytics_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_account_analytics_snapshot_date ON account_analytics_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_account_analytics_platform ON account_analytics_snapshots(platform);
CREATE INDEX IF NOT EXISTS idx_account_analytics_date_range ON account_analytics_snapshots(page_id, snapshot_date);

-- Create GIN indexes for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_account_analytics_raw_metrics ON account_analytics_snapshots USING GIN (raw_metrics);
CREATE INDEX IF NOT EXISTS idx_account_analytics_demographic_data ON account_analytics_snapshots USING GIN (demographic_data);
CREATE INDEX IF NOT EXISTS idx_account_analytics_platform_metadata ON account_analytics_snapshots USING GIN (platform_metadata);

-- Add comments for documentation
COMMENT ON TABLE account_analytics_snapshots IS 'Stores daily snapshots of account/page analytics from social media platforms. Each snapshot captures metrics at a specific point in time for trend analysis.';
COMMENT ON COLUMN account_analytics_snapshots.snapshot_date IS 'The date for which the analytics data was captured (YYYY-MM-DD).';
COMMENT ON COLUMN account_analytics_snapshots.raw_metrics IS 'Full JSON response from platform API for reference and debugging.';
COMMENT ON COLUMN account_analytics_snapshots.demographic_data IS 'Demographic breakdown (age, gender, location) if available from platform.';
COMMENT ON COLUMN account_analytics_snapshots.platform_metadata IS 'Platform-specific metadata and additional metrics.';

-- Enable RLS (Row Level Security) on the table
ALTER TABLE account_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view account analytics snapshots in their workspaces
CREATE POLICY "Users can view account analytics snapshots in their workspaces" ON account_analytics_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN social_pages sp ON sp.id = account_analytics_snapshots.page_id
      WHERE m.workspace_id = sp.workspace_id
      AND m.email = auth.jwt() ->> 'email'
    )
  );

-- Policy: Only system can insert analytics snapshots (via cron job with service role)
CREATE POLICY "System can insert account analytics snapshots" ON account_analytics_snapshots
  FOR INSERT WITH CHECK (true);

-- Policy: Only system can update analytics snapshots
CREATE POLICY "System can update account analytics snapshots" ON account_analytics_snapshots
  FOR UPDATE USING (true);

-- Migration completed successfully
