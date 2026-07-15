-- Add Direct Messages and User Blocking to Chat System
-- Supports 1-on-1 private conversations and user blocking

-- Direct messages table (1-on-1 conversations)
create table if not exists chat_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references user_profiles(id) on delete cascade,
  recipient_id uuid not null references user_profiles(id) on delete cascade,
  body text not null,
  deleted_at timestamptz,  -- soft-delete like regular messages
  created_at timestamptz not null default now(),

  -- Prevent sending to self
  constraint no_self_dm check (sender_id != recipient_id)
);

-- Index for fast lookup of conversations (conversation_idx combines both directions)
create index if not exists chat_direct_messages_conversation_idx
  on chat_direct_messages (
    least(sender_id, recipient_id),
    greatest(sender_id, recipient_id),
    created_at desc
  );

-- Index for finding messages received by a user
create index if not exists chat_direct_messages_recipient_idx
  on chat_direct_messages (recipient_id, created_at desc);

-- User blocking table (who blocked whom)
create table if not exists chat_user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references user_profiles(id) on delete cascade,
  blocked_user_id uuid not null references user_profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),

  -- Unique: one block per blocker-blocked pair
  unique (blocker_id, blocked_user_id),

  -- Prevent blocking self
  constraint no_self_block check (blocker_id != blocked_user_id)
);

-- Index for fast blocking checks (who has blocked me?)
create index if not exists chat_user_blocks_blocker_idx
  on chat_user_blocks (blocker_id);

-- Index for checking if a user is blocked by someone
create index if not exists chat_user_blocks_blocked_idx
  on chat_user_blocks (blocked_user_id);
