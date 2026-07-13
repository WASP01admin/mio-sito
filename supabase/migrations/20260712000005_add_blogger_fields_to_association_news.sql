-- Add blogger support to association_news table
ALTER TABLE association_news
ADD COLUMN author_type TEXT DEFAULT 'hq' CHECK (author_type IN ('hq', 'association', 'blogger')),
ADD COLUMN blogger_id UUID REFERENCES news_bloggers(id) ON DELETE SET NULL;

-- Update RLS policy to include blogger access
-- Bloggers can only create/edit/delete their own news
CREATE POLICY bloggers_manage_own_news ON association_news
  FOR SELECT
  USING (
    author_type = 'blogger' AND blogger_id = auth.uid() OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin' OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'association'
  );
-- Create index for fast blogger news lookups
CREATE INDEX idx_association_news_blogger_id ON association_news(blogger_id);
CREATE INDEX idx_association_news_author_type ON association_news(author_type);
