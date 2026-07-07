-- Function to cleanup old chat images (older than 2 days)
create or replace function cleanup_old_chat_images()
returns table(deleted_count int, freed_bytes bigint) as $$
declare
  v_deleted_count int := 0;
  v_freed_bytes bigint := 0;
  v_two_days_ago timestamp with time zone;
begin
  v_two_days_ago := now() - interval '2 days';

  -- Calculate total bytes to be freed
  select coalesce(sum(file_size_bytes), 0)
  into v_freed_bytes
  from chat_image_uploads
  where uploaded_at < v_two_days_ago;

  -- Count files to be deleted
  select count(*)
  into v_deleted_count
  from chat_image_uploads
  where uploaded_at < v_two_days_ago;

  -- Delete old records from tracking table
  -- Note: Manual deletion of files from storage bucket via Supabase dashboard
  -- or use storage.remove() separately if available
  delete from chat_image_uploads where uploaded_at < v_two_days_ago;

  return query select v_deleted_count, v_freed_bytes;
end;
$$ language plpgsql security definer;
