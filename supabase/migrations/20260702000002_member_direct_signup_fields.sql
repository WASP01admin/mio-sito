-- Only populated for members who apply directly to WASP (no existing
-- association vouching for them) -- association-affiliated members stay
-- nickname-only, per the "no personal data" promise on the homepage.
alter table user_profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists fiscal_code text,
  add column if not exists notes_1 text,
  add column if not exists notes_2 text;
