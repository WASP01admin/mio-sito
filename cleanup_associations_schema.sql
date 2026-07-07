-- ============================================
-- CLEANUP ASSOCIATIONS TABLE SCHEMA
-- Restore pure 14-column universal structure
-- ============================================
--
-- Purpose: Remove extra columns that don't belong in the universal schema
-- Database: WASP associations table
-- Date: July 6, 2026
--
-- These columns are being removed:
--   - password_hash (AUTH field - shouldn't be here)
--   - last_login (AUTH field - shouldn't be here)
--   - notes_1 (Not in universal schema)
--   - notes_2 (Not in universal schema)
--   - facebook_url (Not in universal schema)
--   - saved_map_lat (User preference - shouldn't be here)
--   - saved_map_lng (User preference - shouldn't be here)
--   - saved_map_zoom (User preference - shouldn't be here)
--
-- Kept columns (14 + code + system):
--   ✓ code, name, country, city, address, website, email, phone
--   ✓ lat, lng, instagram, email_secondary, postal_code, contact_person, extra_details
--   ✓ id, created_at, updated_at (system columns)
--
-- ============================================

-- Remove auth fields
ALTER TABLE associations DROP COLUMN IF EXISTS password_hash;
ALTER TABLE associations DROP COLUMN IF EXISTS last_login;

-- Remove non-universal data fields
ALTER TABLE associations DROP COLUMN IF EXISTS notes_1;
ALTER TABLE associations DROP COLUMN IF EXISTS notes_2;
ALTER TABLE associations DROP COLUMN IF EXISTS facebook_url;

-- Remove user preference fields
ALTER TABLE associations DROP COLUMN IF EXISTS saved_map_lat;
ALTER TABLE associations DROP COLUMN IF EXISTS saved_map_lng;
ALTER TABLE associations DROP COLUMN IF EXISTS saved_map_zoom;

-- ============================================
-- VERIFICATION QUERY
-- Run this after cleanup to verify the schema
-- ============================================

-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'associations'
-- ORDER BY ordinal_position;

-- Expected result: 18 columns
--   1. code (primary key)
--   2. name
--   3. country
--   4. city
--   5. address
--   6. website
--   7. email
--   8. phone
--   9. lat
--  10. lng
--  11. instagram
--  12. email_secondary
--  13. postal_code
--  14. contact_person
--  15. extra_details
--  16. id (system)
--  17. created_at (system)
--  18. updated_at (system)
