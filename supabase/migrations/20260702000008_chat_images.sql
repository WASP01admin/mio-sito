-- Images post immediately, same moderation model as text: report + admin
-- delete. No automated content scanning at this stage.
alter table chat_messages add column if not exists image_path text;
alter table chat_messages alter column body drop not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-images',
  'chat-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;
