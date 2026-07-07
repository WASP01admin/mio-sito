-- Donors: shops/businesses that donate to animal welfare orgs and get
-- mapped on the "Friends of Animals" map. Structurally mirrors
-- associations (same manual-mapping workflow), but is a separate concept
-- entirely -- donors are never linked from user_profiles.
create table if not exists donors (
  id uuid primary key default gen_random_uuid(),
  code varchar(7) unique,
  name text not null,
  city text not null,
  country text,
  address text,
  postal_code text,
  lat double precision,
  lng double precision,
  phone text,
  email text,
  email_secondary text,
  website text,
  facebook_url text,
  contact_person text,
  notes_1 text,
  notes_2 text,
  extra_details jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(city, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donors_search_vector_idx
  on donors using gin (search_vector);
create index if not exists donors_name_trgm_idx
  on donors using gin (name gin_trgm_ops);
create index if not exists donors_city_trgm_idx
  on donors using gin (city gin_trgm_ops);
