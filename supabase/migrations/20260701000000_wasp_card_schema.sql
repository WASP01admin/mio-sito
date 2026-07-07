-- WASP Card system: associations, member profiles, pending submissions,
-- Apple Wallet device registrations, and a minimal audit log.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================
-- associations
-- ============================================================
-- code = 3-letter country code + 4-char association code, e.g. "CAN0041".
-- A user's final unique_membership_code appends a 4-char suffix to this
-- (e.g. "CAN0041X9F2"), giving the 11-char value in user_profiles.
create table if not exists associations (
  id uuid primary key default gen_random_uuid(),
  code varchar(7) not null unique,
  name text not null,
  city text not null,
  country text,
  address text,
  postal_code text,
  lat double precision,
  lng double precision,
  phone text,
  email text,
  website text,
  -- Long-tail fields (Facebook, Instagram, notes, secondary contacts, ...)
  -- live here so new fields don't require a migration every time.
  extra_details jsonb not null default '{}'::jsonb,
  -- Generated tsvector for word-order-independent full text search
  -- (e.g. "Cats and Dogs" query still finds "Dogs and Cats" record).
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(city, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists associations_search_vector_idx
  on associations using gin (search_vector);
create index if not exists associations_name_trgm_idx
  on associations using gin (name gin_trgm_ops);
create index if not exists associations_city_trgm_idx
  on associations using gin (city gin_trgm_ops);

-- ============================================================
-- user_profiles
-- ============================================================
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id),
  nickname varchar(100),
  email varchar(255) not null unique,
  photo_path varchar(512),

  -- Assigned once the user's own email verification (Email 2) succeeds.
  unique_membership_code varchar(11) unique,

  -- Check 1: does this email address belong to a real person (double opt-in).
  is_verified boolean not null default false,
  verification_token varchar(64),
  token_expires_at timestamptz,
  -- 'signup' -> completing this token finishes registration.
  -- 'renewal' -> completing this token just extends expires_at by 1 year.
  token_purpose varchar(16) check (token_purpose in ('signup', 'renewal')),

  -- Check 2: does the claimed association confirm this email on file.
  -- Tracked with timestamps (not just a boolean) so the admin panel can
  -- show how long a claim has been sitting unconfirmed.
  association_contacted_at timestamptz,
  association_confirmed_at timestamptz,

  membership_status varchar(16) not null default 'pending'
    check (membership_status in ('pending', 'approved', 'rejected')),
  expires_at timestamptz,

  -- Per-pass auth token required by Apple's Wallet Web Service protocol
  -- (sent in the Authorization header on every device callback).
  wallet_authentication_token varchar(64),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_association_id_idx
  on user_profiles (association_id);
create index if not exists user_profiles_membership_status_idx
  on user_profiles (membership_status);

-- ============================================================
-- pending_submissions
-- ============================================================
-- Fail-safe log for registrations whose claimed association couldn't be
-- matched. Nothing is silently dropped; Email 1 goes out and this row
-- waits for an admin to resolve it (which auto-fires Email 2).
create table if not exists pending_submissions (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null,
  nickname varchar(100),
  submitted_association_string text not null,
  photo_path varchar(512),
  status varchar(16) not null default 'open'
    check (status in ('open', 'resolved', 'discarded')),
  resolved_association_id uuid references associations(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists pending_submissions_status_idx
  on pending_submissions (status);

-- ============================================================
-- device_registrations (Apple Wallet Web Service)
-- ============================================================
-- Tracks which devices are holding a given pass so an APNs push can be
-- sent when membership_status flips to 'approved'.
create table if not exists device_registrations (
  id uuid primary key default gen_random_uuid(),
  user_profile_id uuid not null references user_profiles(id) on delete cascade,
  device_library_identifier text not null,
  pass_type_identifier text not null,
  push_token text not null,
  created_at timestamptz not null default now(),
  unique (device_library_identifier, pass_type_identifier, user_profile_id)
);

create index if not exists device_registrations_user_profile_id_idx
  on device_registrations (user_profile_id);

-- ============================================================
-- audit_log
-- ============================================================
-- Single-admin operation: just "what changed", no user/role attribution.
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type varchar(32) not null,
  entity_id uuid not null,
  field varchar(64) not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);

create index if not exists audit_log_entity_idx
  on audit_log (entity_type, entity_id);
