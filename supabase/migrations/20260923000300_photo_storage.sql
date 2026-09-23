-- NODO · photo storage
--
-- Two public buckets: anyone can look at a listing's photos or a store's logo
-- (the app serves them from its own domain, /fotos/...). Uploading is only
-- allowed into your own folder, "<your user id>/...", so nobody can overwrite
-- or delete someone else's photos. Files are small because the app shrinks
-- them on the phone before sending.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 1500000, array['image/jpeg', 'image/png', 'image/webp']),
  ('store-logos', 'store-logos', true, 400000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "nodo: upload into own folder" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('product-images', 'store-logos')
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Lets the uploader read back what they just stored; everyone else uses the
-- public URL, which doesn't go through these policies.
create policy "nodo: see own uploads" on storage.objects for select to authenticated
  using (
    bucket_id in ('product-images', 'store-logos')
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "nodo: delete own uploads" on storage.objects for delete to authenticated
  using (
    bucket_id in ('product-images', 'store-logos')
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
