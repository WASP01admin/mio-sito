-- Add WASP Card fields to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS card_number VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS card_issued_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS card_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS card_status VARCHAR(20) DEFAULT 'pending' CHECK (card_status IN ('pending', 'active', 'expired', 'revoked')),
  ADD COLUMN IF NOT EXISTS card_request_type VARCHAR(20) CHECK (card_request_type IN ('associated', 'direct')),
  ADD COLUMN IF NOT EXISTS card_payment_id VARCHAR(255);

-- Create indexes for card lookups
CREATE INDEX IF NOT EXISTS user_profiles_card_number_idx
  ON user_profiles(card_number);

CREATE INDEX IF NOT EXISTS user_profiles_card_status_idx
  ON user_profiles(card_status);

CREATE INDEX IF NOT EXISTS user_profiles_card_expires_at_idx
  ON user_profiles(card_expires_at);
