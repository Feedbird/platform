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
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_posts_brand_id ON posts(brand_id);
CREATE INDEX IF NOT EXISTS idx_posts_board_id ON posts(board_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_brand_id ON social_accounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_social_pages_brand_id ON social_pages(brand_id);
CREATE INDEX IF NOT EXISTS idx_social_pages_account_id ON social_pages(account_id);
CREATE INDEX IF NOT EXISTS idx_post_history_page_id ON post_history(page_id);
CREATE INDEX IF NOT EXISTS idx_members_workspace_id ON members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_members_board_id ON members(board_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;

-- Create policies (you may need to adjust these based on your authentication setup)
-- For now, we'll allow all operations (you should restrict these based on user authentication)

-- Users table policies
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Workspaces table policies
CREATE POLICY "Workspaces are viewable by everyone" ON workspaces FOR SELECT USING (true);
CREATE POLICY "Workspaces can be created by everyone" ON workspaces FOR INSERT WITH CHECK (true);
CREATE POLICY "Workspaces can be updated by everyone" ON workspaces FOR UPDATE USING (true);
CREATE POLICY "Workspaces can be deleted by everyone" ON workspaces FOR DELETE USING (true);

-- Brands table policies
CREATE POLICY "Brands are viewable by everyone" ON brands FOR SELECT USING (true);
CREATE POLICY "Brands can be created by everyone" ON brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Brands can be updated by everyone" ON brands FOR UPDATE USING (true);
CREATE POLICY "Brands can be deleted by everyone" ON brands FOR DELETE USING (true);

-- Boards table policies
CREATE POLICY "Boards are viewable by everyone" ON boards FOR SELECT USING (true);
CREATE POLICY "Boards can be created by everyone" ON boards FOR INSERT WITH CHECK (true);
CREATE POLICY "Boards can be updated by everyone" ON boards FOR UPDATE USING (true);
CREATE POLICY "Boards can be deleted by everyone" ON boards FOR DELETE USING (true);

-- Posts table policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Posts can be created by everyone" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Posts can be updated by everyone" ON posts FOR UPDATE USING (true);
CREATE POLICY "Posts can be deleted by everyone" ON posts FOR DELETE USING (true);

-- Social accounts table policies
CREATE POLICY "Social accounts are viewable by everyone" ON social_accounts FOR SELECT USING (true);
CREATE POLICY "Social accounts can be created by everyone" ON social_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Social accounts can be updated by everyone" ON social_accounts FOR UPDATE USING (true);
CREATE POLICY "Social accounts can be deleted by everyone" ON social_accounts FOR DELETE USING (true);

-- Social pages table policies
CREATE POLICY "Social pages are viewable by everyone" ON social_pages FOR SELECT USING (true);
CREATE POLICY "Social pages can be created by everyone" ON social_pages FOR INSERT WITH CHECK (true);
CREATE POLICY "Social pages can be updated by everyone" ON social_pages FOR UPDATE USING (true);
CREATE POLICY "Social pages can be deleted by everyone" ON social_pages FOR DELETE USING (true);

-- Board templates table policies
CREATE POLICY "Board templates are viewable by everyone" ON board_templates FOR SELECT USING (true);
CREATE POLICY "Board templates can be created by everyone" ON board_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Board templates can be updated by everyone" ON board_templates FOR UPDATE USING (true);
CREATE POLICY "Board templates can be deleted by everyone" ON board_templates FOR DELETE USING (true);

-- Members table policies
CREATE POLICY "Members are viewable by everyone" ON members FOR SELECT USING (true);
CREATE POLICY "Members can be created by everyone" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can be updated by everyone" ON members FOR UPDATE USING (true);
CREATE POLICY "Members can be deleted by everyone" ON members FOR DELETE USING (true);

-- Post history table policies
CREATE POLICY "Post history is viewable by everyone" ON post_history FOR SELECT USING (true);
CREATE POLICY "Post history can be created by everyone" ON post_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Post history can be updated by everyone" ON post_history FOR UPDATE USING (true);
CREATE POLICY "Post history can be deleted by everyone" ON post_history FOR DELETE USING (true);

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