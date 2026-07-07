-- Closed chat system: only reachable via a valid card's wallet_authentication_token
-- (see /api/chat/enter in the web app). No public signup exists for this at all.
create table if not exists chat_channels (
  id uuid primary key default gen_random_uuid(),
  slug varchar(32) not null unique,
  name text not null,
  description text,
  is_default boolean not null default false,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references chat_channels(id) on delete cascade,
  user_profile_id uuid not null references user_profiles(id),
  -- Denormalized at send-time so chat history stays stable even if the
  -- member later changes their nickname.
  nickname varchar(20) not null,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_channel_created_idx
  on chat_messages (channel_id, created_at);

create table if not exists chat_bans (
  id uuid primary key default gen_random_uuid(),
  user_profile_id uuid not null references user_profiles(id) unique,
  reason text,
  created_at timestamptz not null default now()
);

insert into chat_channels (slug, name, description, is_default)
values ('lobby', 'Lobby', 'The default room every cardholder lands in.', true)
on conflict (slug) do nothing;
