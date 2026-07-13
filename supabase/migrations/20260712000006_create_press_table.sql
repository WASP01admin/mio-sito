-- Create press table (duplicate of associations but for news publishers)
CREATE TABLE press (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(7) UNIQUE NOT NULL, -- ITA0001 format
  name TEXT NOT NULL,
  description TEXT,
  country VARCHAR(3),
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  password TEXT NOT NULL, -- Plain text for now (like associations)
  verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_press_code ON press(code);
CREATE INDEX idx_press_verified ON press(verified);

-- Enable RLS
ALTER TABLE press ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read verified press (for public news display)
CREATE POLICY press_read_verified ON press
  FOR SELECT
  USING (verified = true);

-- RLS Policy: Press can read their own data
CREATE POLICY press_read_own ON press
  FOR SELECT
  USING (auth.uid()::text = id::text OR true);
