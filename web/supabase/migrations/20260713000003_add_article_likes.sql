-- Create article_likes table
CREATE TABLE IF NOT EXISTS article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (article_id) REFERENCES press_articles(id) ON DELETE CASCADE,
  UNIQUE(article_id, session_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_session_id ON article_likes(session_id);

-- Enable RLS
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;

-- Allow public read and anonymous insert/delete (based on session_id)
CREATE POLICY "Allow public read likes" ON article_likes
  FOR SELECT USING (true);

CREATE POLICY "Allow insert likes" ON article_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete own likes" ON article_likes
  FOR DELETE USING (true);
