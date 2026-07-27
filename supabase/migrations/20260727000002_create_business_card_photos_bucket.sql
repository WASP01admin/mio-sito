-- Create the business-card-photos storage bucket
-- Note: This migration creates the bucket structure; the actual bucket
-- creation in Supabase dashboard may need to be done separately.

-- Enable storage extension if not already enabled
create extension if not exists storage;

-- Create bucket for business card photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-card-photos',
  'business-card-photos',
  false,  -- private bucket
  5242880,  -- 5MB limit per file
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do nothing;

-- Create storage policies for business-card-photos bucket
-- Allow authenticated users to upload their own photos
create policy "Users can upload their own business card photos"
  on storage.objects for insert
  with check (
    bucket_id = 'business-card-photos'
    and auth.role() = 'authenticated'
  );

-- Allow public read access (optional - for displaying photos)
create policy "Public can read business card photos"
  on storage.objects for select
  with check (bucket_id = 'business-card-photos');

-- Allow service role to delete photos
create policy "Service role can delete business card photos"
  on storage.objects for delete
  using (
    bucket_id = 'business-card-photos'
    and auth.role() = 'service_role'
  );
