-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo TEXT,
  createdby TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo TEXT,
  style_guide JSONB,
  link TEXT,
  voice TEXT,
  prefs TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image TEXT,
  selected_image TEXT,
  description TEXT,
  color TEXT,
  rules JSONB,
  group_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  caption JSONB NOT NULL,
  status TEXT NOT NULL,
  format TEXT NOT NULL,
  publish_date TIMESTAMP WITH TIME ZONE,
  platforms TEXT[] DEFAULT '{}',
  pages TEXT[] DEFAULT '{}',
  billing_month TEXT,
  month INTEGER DEFAULT 1,
  settings JSONB,
  hashtags JSONB,
  blocks JSONB DEFAULT '[]',
  comments JSONB DEFAULT '[]',
  activities JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  auth_token TEXT,
  connected BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  connected BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  status_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image TEXT,
  description TEXT,
  color TEXT,
  rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  content JSONB NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table (normalized from posts.activities JSONB)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  is_workspace BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brands_workspace_id ON brands(workspace_id);
CREATE INDEX IF NOT EXISTS idx_boards_workspace_id ON boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_posts_workspace_id ON posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_posts_board_id ON posts(board_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_brand_id ON social_accounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_social_pages_brand_id ON social_pages(brand_id);
CREATE INDEX IF NOT EXISTS idx_social_pages_account_id ON social_pages(account_id);
CREATE INDEX IF NOT EXISTS idx_post_history_page_id ON post_history(page_id);
CREATE INDEX IF NOT EXISTS idx_members_workspace_id ON members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_members_board_id ON members(board_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_activities_post_id ON activities(post_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for workspaces table
CREATE POLICY "Users can view workspaces they are members of" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = workspaces.id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Users can update workspaces they are members of" ON workspaces
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = workspaces.id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

-- Create policies for brands table
CREATE POLICY "Users can view brands in their workspaces" ON brands
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = brands.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create brands in their workspaces" ON brands
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = brands.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update brands in their workspaces" ON brands
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = brands.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can delete brands in their workspaces" ON brands
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = brands.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

-- Create policies for boards table
CREATE POLICY "Users can view boards in their workspaces" ON boards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = boards.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create boards in their workspaces" ON boards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = boards.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update boards in their workspaces" ON boards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = boards.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can delete boards in their workspaces" ON boards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = boards.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

-- Create policies for posts table
CREATE POLICY "Users can view posts in their workspaces" ON posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = posts.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create posts in their workspaces" ON posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = posts.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update posts in their workspaces" ON posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = posts.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can delete posts in their workspaces" ON posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.workspace_id = posts.workspace_id 
      AND members.email = auth.jwt() ->> 'email'
    )
  );

-- Create policies for social_accounts table
CREATE POLICY "Users can view social accounts in their workspaces" ON social_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN brands b ON b.workspace_id = m.workspace_id
      WHERE b.id = social_accounts.brand_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create social accounts in their workspaces" ON social_accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      JOIN brands b ON b.workspace_id = m.workspace_id
      WHERE b.id = social_accounts.brand_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update social accounts in their workspaces" ON social_accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN brands b ON b.workspace_id = m.workspace_id
      WHERE b.id = social_accounts.brand_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can delete social accounts in their workspaces" ON social_accounts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN brands b ON b.workspace_id = m.workspace_id
      WHERE b.id = social_accounts.brand_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

-- Create policies for social_pages table
CREATE POLICY "Users can view social pages in their workspaces" ON social_pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN brands b ON b.workspace_id = m.workspace_id
      WHERE b.id = social_pages.brand_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create social pages in their workspaces" ON social_pages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      JOIN brands b ON b.workspace_id = m.workspace_id
      WHERE b.id = social_pages.brand_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update social pages in their workspaces" ON social_pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN brands b ON b.workspace_id = m.workspace_id
      WHERE b.id = social_pages.brand_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can delete social pages in their workspaces" ON social_pages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN brands b ON b.workspace_id = m.workspace_id
      WHERE b.id = social_pages.brand_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

-- Create policies for board_templates table
CREATE POLICY "Users can view board templates" ON board_templates
  FOR SELECT USING (true);

CREATE POLICY "Users can create board templates" ON board_templates
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Users can update board templates" ON board_templates
  FOR UPDATE USING (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Users can delete board templates" ON board_templates
  FOR DELETE USING (auth.jwt() ->> 'email' IS NOT NULL);

-- Create policies for post_history table
CREATE POLICY "Users can view post history" ON post_history
  FOR SELECT USING (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Users can create post history" ON post_history
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Users can update post history" ON post_history
  FOR UPDATE USING (auth.jwt() ->> 'email' IS NOT NULL);

CREATE POLICY "Users can delete post history" ON post_history
  FOR DELETE USING (auth.jwt() ->> 'email' IS NOT NULL);

-- Create policies for activities table
CREATE POLICY "Users can view activities in their workspaces" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN members m ON m.workspace_id = p.workspace_id
      WHERE p.id = activities.post_id
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create activities in their workspaces" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN members m ON m.workspace_id = p.workspace_id
      WHERE p.id = activities.post_id
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update activities in their workspaces" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN members m ON m.workspace_id = p.workspace_id
      WHERE p.id = activities.post_id
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can delete activities in their workspaces" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN members m ON m.workspace_id = p.workspace_id
      WHERE p.id = activities.post_id
      AND m.email = auth.jwt() ->> 'email'
    )
  );

-- Create policies for members table
CREATE POLICY "Users can view members in their workspaces" ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.workspace_id = members.workspace_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create members in their workspaces" ON members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.workspace_id = members.workspace_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update members in their workspaces" ON members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.workspace_id = members.workspace_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can delete members in their workspaces" ON members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.workspace_id = members.workspace_id 
      AND m.email = auth.jwt() ->> 'email'
    )
  );

-- Create functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_pages_updated_at BEFORE UPDATE ON social_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_board_templates_updated_at BEFORE UPDATE ON board_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 