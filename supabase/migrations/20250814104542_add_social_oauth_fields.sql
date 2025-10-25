-- Migration script to add OAuth fields to existing tables
-- Run this in your Supabase SQL editor

-- Add missing fields to social_accounts table
ALTER TABLE social_accounts 
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS token_issued_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add missing fields to social_pages table  
ALTER TABLE social_pages
ADD COLUMN IF NOT EXISTS auth_token TEXT,
ADD COLUMN IF NOT EXISTS auth_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS entity_type TEXT;


-- Add unique constraints to prevent duplicates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_brand_platform_account' 
        AND table_name = 'social_accounts'
    ) THEN
        ALTER TABLE social_accounts 
        ADD CONSTRAINT unique_brand_platform_account 
        UNIQUE (platform, account_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_account_page' 
        AND table_name = 'social_pages'
    ) THEN
        ALTER TABLE social_pages 
        ADD CONSTRAINT unique_account_page 
        UNIQUE (account_id, page_id);
    END IF;
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_status ON social_accounts(status);
CREATE INDEX IF NOT EXISTS idx_social_accounts_token_expiry ON social_accounts(access_token_expires_at);
CREATE INDEX IF NOT EXISTS idx_social_accounts_refresh_expiry ON social_accounts(refresh_token_expires_at);
CREATE INDEX IF NOT EXISTS idx_social_pages_status ON social_pages(status);
CREATE INDEX IF NOT EXISTS idx_social_pages_token_expiry ON social_pages(auth_token_expires_at);

-- Migration completed successfully
