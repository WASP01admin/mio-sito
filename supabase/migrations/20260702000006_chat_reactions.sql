create table if not exists chat_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references chat_messages(id) on delete cascade,
  user_profile_id uuid not null references user_profiles(id),
  emoji varchar(8) not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_profile_id, emoji)
);

create index if not exists chat_message_reactions_message_id_idx
  on chat_message_reactions (message_id);
