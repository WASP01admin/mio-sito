-- Business WASP Cards Table (for "Amici degli Animali" businesses)
create table if not exists business_cards (
  id uuid primary key default gen_random_uuid(),
  card_id text unique not null,  -- Format: {CountryCode}-BIZ-{5-digit-alphanumeric}
  nickname text not null,
  country_code text not null,  -- 3-letter country code (e.g., "ITA")
  business_name text not null,  -- Name as shown on map
  partita_iva text not null,  -- Business tax ID or equivalent
  email text not null,
  photo_url text,
  status text not null default 'pending',  -- pending, active, suspended, rejected
  email_verified boolean default false,
  verification_token text unique,  -- For email verification
  verification_token_expires_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraints
  check (status in ('pending', 'active', 'suspended', 'rejected')),
  check (length(country_code) = 3),
  check (length(card_id) > 0)
);

-- Indexes
create index if not exists business_cards_card_id_idx on business_cards(card_id);
create index if not exists business_cards_email_idx on business_cards(email);
create index if not exists business_cards_status_idx on business_cards(status);
create index if not exists business_cards_verification_token_idx on business_cards(verification_token);

-- Trigger to update updated_at timestamp
create or replace function update_business_cards_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger business_cards_updated_at_trigger
before update on business_cards
for each row
execute function update_business_cards_updated_at();
