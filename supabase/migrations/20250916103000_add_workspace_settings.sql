-- Add workspace settings fields: timezone, week_start, time_format
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS week_start TEXT CHECK (week_start IN ('monday','sunday')),
  ADD COLUMN IF NOT EXISTS time_format TEXT CHECK (time_format IN ('24h','12h'));


