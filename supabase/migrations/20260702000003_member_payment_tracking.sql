-- Only relevant for direct-signup members (association code ITAWASP), who
-- owe a small membership fee. Set manually by admin when payment arrives --
-- no payment gateway integration yet, this is just the tracking flag.
alter table user_profiles
  add column if not exists payment_received_at timestamptz;
