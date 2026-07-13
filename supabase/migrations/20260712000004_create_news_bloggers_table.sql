-- Create news_bloggers table for independent content creators
CREATE TABLE news_bloggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  blog_url TEXT,
  bio TEXT,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast lookups
CREATE INDEX idx_news_bloggers_email ON news_bloggers(email);
CREATE INDEX idx_news_bloggers_status ON news_bloggers(status);

-- Enable RLS
ALTER TABLE news_bloggers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can check if their email exists (for login)
CREATE POLICY news_bloggers_login ON news_bloggers
  FOR SELECT
  USING (true);
