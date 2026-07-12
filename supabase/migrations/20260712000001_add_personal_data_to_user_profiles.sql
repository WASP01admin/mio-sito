-- Add personal data fields for direct WASP card requesters
-- These fields allow verification of tax ID (codice fiscale) authenticity
-- through cross-referencing with birth date, gender, and birthplace

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS gender char(1) CHECK (gender IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS birth_place text;

-- Create index for potential future queries on birth data
CREATE INDEX IF NOT EXISTS user_profiles_birth_date_idx
  ON user_profiles(birth_date);
