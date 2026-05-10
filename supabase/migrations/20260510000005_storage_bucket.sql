-- Create public images storage bucket
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Allow authenticated users to read images (public bucket)
create policy "images_public_read" on storage.objects
  for select using (bucket_id = 'images');

-- Allow admin users to upload images
create policy "images_admin_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'images' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow admin users to delete images
create policy "images_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'images' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
