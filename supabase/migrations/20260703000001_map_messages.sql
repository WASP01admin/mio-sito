-- Map messages: messages left by WASP Card holders on Association/Donor markers.
-- Associations can reply even without a card (via their private area).
-- Stored separately from chat messages.
create table if not exists map_messages (
  id uuid primary key default gen_random_uuid(),
  marker_type text not null check (marker_type in ('association', 'donor')),
  marker_id uuid not null,
  user_profile_id uuid not null references user_profiles(id) on delete cascade,
  message_text text not null,
  parent_message_id uuid references map_messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists map_messages_marker_idx
  on map_messages (marker_type, marker_id);
create index if not exists map_messages_user_idx
  on map_messages (user_profile_id);
create index if not exists map_messages_parent_idx
  on map_messages (parent_message_id);
create index if not exists map_messages_created_idx
  on map_messages (created_at desc);
