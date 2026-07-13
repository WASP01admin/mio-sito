-- Create press_articles table for press-specific articles
CREATE TABLE press_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  press_id UUID NOT NULL REFERENCES press(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  published_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups by press_id
CREATE INDEX idx_press_articles_press_id ON press_articles(press_id);

-- Enable RLS
ALTER TABLE press_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Press can see only their own articles
CREATE POLICY "Press can view own articles" ON press_articles
  FOR SELECT
  USING (press_id = (SELECT id FROM press WHERE verified = true LIMIT 1));

-- RLS Policy: Press can insert only to their own articles
CREATE POLICY "Press can insert own articles" ON press_articles
  FOR INSERT
  WITH CHECK (press_id = (SELECT id FROM press WHERE verified = true LIMIT 1));

-- RLS Policy: Press can delete only their own articles
CREATE POLICY "Press can delete own articles" ON press_articles
  FOR DELETE
  USING (press_id = (SELECT id FROM press WHERE verified = true LIMIT 1));
