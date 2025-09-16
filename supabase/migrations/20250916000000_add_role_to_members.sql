-- Add role column to members table with allowed values 'client' and 'team'
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'team' CHECK (role IN ('client','team'));

-- Helpful index for filtering by role
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);


