create table if not exists donors (
  id uuid primary key default gen_random_uuid(),
  code varchar(7) not null unique,
  name text not null,
  city text,
  country text,
  address text,
  postal_code text,
  lat float8,
  lng float8,
  phone text,
  email text,
  website text,
  is_super_friend boolean not null default false,
  extra_details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donors_lat_lng_idx on donors (lat, lng) where lat is not null;
create index if not exists donors_is_super_friend_idx on donors (is_super_friend);
