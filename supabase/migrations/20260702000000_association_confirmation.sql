-- One-click Yes/No confirmation for the association-side membership check.
-- The token is intentionally NOT single-use/cleared-on-read: mail security
-- scanners (e.g. Microsoft Safe Links) can pre-fetch links automatically,
-- which would burn a single-use token before a human ever saw it. Instead
-- the endpoint is idempotent -- each click just overwrites the recorded
-- answer with the latest one, and admin still makes the final call.
alter table user_profiles
  add column if not exists association_confirmation_token varchar(64),
  add column if not exists association_reply varchar(8)
    check (association_reply in ('yes', 'no'));

create index if not exists user_profiles_association_confirmation_token_idx
  on user_profiles (association_confirmation_token);
