-- Track per-user chat image upload stats
create table chat_image_uploads (
  id uuid primary key default gen_random_uuid(),
  user_profile_id uuid not null references user_profiles(id) on delete cascade,
  file_path text not null,
  file_size_bytes integer not null,
  uploaded_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Index for fast cleanup queries
create index chat_image_uploads_uploaded_at_idx on chat_image_uploads(uploaded_at);
create index chat_image_uploads_user_id_idx on chat_image_uploads(user_profile_id);

-- Enable RLS
alter table chat_image_uploads enable row level security;

create policy "Users can view their own uploads"
  on chat_image_uploads for select
  using (auth.uid()::text = user_profile_id::text);
