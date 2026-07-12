-- Create association_images table for gallery
CREATE TABLE IF NOT EXISTS association_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  association_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT association_images_url_key UNIQUE(association_id, url)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS association_images_association_id_idx
  ON association_images(association_id);

CREATE INDEX IF NOT EXISTS association_images_created_at_idx
  ON association_images(created_at DESC);

-- Enable RLS
ALTER TABLE association_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy: associations can read their own images
CREATE POLICY "associations_can_read_own_images"
  ON association_images FOR SELECT
  USING (
    association_id IN (
      SELECT id FROM associations WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: associations can insert their own images
CREATE POLICY "associations_can_insert_own_images"
  ON association_images FOR INSERT
  WITH CHECK (
    association_id IN (
      SELECT id FROM associations WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: associations can delete their own images
CREATE POLICY "associations_can_delete_own_images"
  ON association_images FOR DELETE
  USING (
    association_id IN (
      SELECT id FROM associations WHERE user_id = auth.uid()
    )
  );
