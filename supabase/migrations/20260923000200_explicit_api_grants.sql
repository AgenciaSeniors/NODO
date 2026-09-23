-- NODO · explicit API privileges
--
-- Depending on the project's settings, Supabase may or may not grant the API
-- roles (anon, authenticated) access to new tables automatically. Grant exactly
-- what the app needs so it works either way; row level security still decides
-- which rows each person can see or change.
--
-- Inserts and updates on profiles, stores, products and reports are granted
-- per column in the initial schema (plan, verification, status and ownership
-- stay out of reach).

grant usage on schema public to anon, authenticated;

-- Readable by everyone (policies narrow the rows).
grant select on public.provinces, public.municipalities, public.categories to anon, authenticated;
grant select on public.profiles, public.stores, public.products, public.quantity_tiers, public.product_images
  to anon, authenticated;

-- Signed-in people only.
grant select on public.store_members, public.favorites, public.store_follows to authenticated;
grant insert, update, delete on public.store_members, public.quantity_tiers, public.product_images to authenticated;
grant insert, delete on public.favorites, public.store_follows to authenticated;
grant delete on public.stores, public.products to authenticated;
