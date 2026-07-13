-- Add press support to association_news table
ALTER TABLE association_news
ADD COLUMN press_code VARCHAR(7),
ADD COLUMN press_name TEXT;

-- Create index for fast press news lookups
CREATE INDEX idx_association_news_press_code ON association_news(press_code);
