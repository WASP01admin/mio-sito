create table if not exists vips (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  surname_initial varchar(1) not null,
  nationality_code varchar(3) not null,
  bio text not null,
  image_url text not null,
  organization text not null default 'WASP HQ',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vips_created_idx on vips (created_at desc);
