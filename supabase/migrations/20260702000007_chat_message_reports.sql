create table if not exists chat_message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references chat_messages(id) on delete cascade,
  reporter_user_profile_id uuid not null references user_profiles(id),
  created_at timestamptz not null default now(),
  unique (message_id, reporter_user_profile_id)
);

create index if not exists chat_message_reports_message_id_idx
  on chat_message_reports (message_id);
