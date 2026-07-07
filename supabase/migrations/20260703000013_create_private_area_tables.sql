-- Add authentication fields to associations
alter table associations add column if not exists password_hash varchar(255);
alter table associations add column if not exists last_login timestamp with time zone;
alter table associations add column if not exists saved_map_lat decimal(10, 8);
alter table associations add column if not exists saved_map_lng decimal(11, 8);
alter table associations add column if not exists saved_map_zoom integer default 4;

-- News table
create table if not exists association_news (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  headline varchar(255) not null,
  description text not null,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Projects/Funding table (no auto-delete)
create table if not exists association_projects (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  headline varchar(255) not null,
  description text not null,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Events table
create table if not exists association_events (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  headline varchar(255) not null,
  description text not null,
  image_url text,
  event_date date not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists association_news_created_at_idx on association_news(created_at desc);
create index if not exists association_news_association_id_idx on association_news(association_id);
create index if not exists association_projects_association_id_idx on association_projects(association_id);
create index if not exists association_projects_created_at_idx on association_projects(created_at desc);
create index if not exists association_events_event_date_idx on association_events(event_date);
create index if not exists association_events_association_id_idx on association_events(association_id);

-- Enable RLS
alter table association_news enable row level security;
alter table association_projects enable row level security;
alter table association_events enable row level security;

-- RLS policies (associations can view all, edit their own)
create policy "Anyone can view news"
  on association_news for select
  using (true);

create policy "Associations can edit their own news"
  on association_news for update
  using (auth.uid()::text = association_id::text);

create policy "Associations can delete their own news"
  on association_news for delete
  using (auth.uid()::text = association_id::text);

create policy "Anyone can view projects"
  on association_projects for select
  using (true);

create policy "Associations can edit their own projects"
  on association_projects for update
  using (auth.uid()::text = association_id::text);

create policy "Associations can delete their own projects"
  on association_projects for delete
  using (auth.uid()::text = association_id::text);

create policy "Anyone can view events"
  on association_events for select
  using (true);

create policy "Associations can edit their own events"
  on association_events for update
  using (auth.uid()::text = association_id::text);

create policy "Associations can delete their own events"
  on association_events for delete
  using (auth.uid()::text = association_id::text);

-- Function to auto-delete news older than 180 days
create or replace function cleanup_old_news()
returns table(deleted_count int) as $$
declare
  v_deleted_count int := 0;
begin
  delete from association_news 
  where created_at < now() - interval '180 days';
  
  get diagnostics v_deleted_count = row_count;
  
  return query select v_deleted_count;
end;
$$ language plpgsql security definer;
