-- Create donors table (same schema as associations for consistency)
CREATE TABLE IF NOT EXISTS public.donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  address TEXT,
  postal_code TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  email TEXT,
  email_secondary TEXT,
  phone TEXT,
  website TEXT,
  facebook_url TEXT,
  contact_person TEXT,
  notes_1 TEXT,
  notes_2 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on code for fast lookups
CREATE INDEX idx_donors_code ON public.donors(code);

-- Create index on country for filtering
CREATE INDEX idx_donors_country ON public.donors(country);

-- Create index on city for searching
CREATE INDEX idx_donors_city ON public.donors(city);

-- Enable RLS
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

-- Admin can read all donors
CREATE POLICY "admin_read_all_donors" ON public.donors
  FOR SELECT USING (true);

-- Admin can create donors
CREATE POLICY "admin_create_donors" ON public.donors
  FOR INSERT WITH CHECK (true);

-- Admin can update donors
CREATE POLICY "admin_update_donors" ON public.donors
  FOR UPDATE USING (true) WITH CHECK (true);

-- Admin can delete donors
CREATE POLICY "admin_delete_donors" ON public.donors
  FOR DELETE USING (true);
