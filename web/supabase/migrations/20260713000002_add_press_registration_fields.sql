-- Add registration and verification fields to press table
ALTER TABLE press ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE press ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE press ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;

-- Update existing records to have email = name (temporary, for existing test records)
UPDATE press SET email = LOWER(name || '@press.local') WHERE email IS NULL;

-- Make email NOT NULL after backfill
ALTER TABLE press ALTER COLUMN email SET NOT NULL;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS press_email_idx ON press(email);

-- Create index on verification_token for verification lookups
CREATE INDEX IF NOT EXISTS press_verification_token_idx ON press(verification_token);
