-- Row level security and business-rule tests. Run with scripts/test-db.sh.
-- Any failed expectation raises an exception and stops psql.

\set ON_ERROR_STOP 1
\set QUIET 1
-- Only NOTICE lines (ok - …) and errors are printed.
\o /dev/null

create or replace function pg_temp.expect(ok boolean, message text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', message; end if;
  raise notice 'ok - %', message;
end;
$$;

-- Runs a statement that must fail with the given SQLSTATE (or any error when null).
create or replace function pg_temp.expect_error(statement text, state text, message text) returns void language plpgsql as $$
begin
  execute statement;
  raise exception 'FAILED: % (no error raised)', message;
exception when others then
  if sqlerrm like 'FAILED:%' then raise; end if;
  if state is not null and sqlstate <> state then
    raise exception 'FAILED: % (got % %)', message, sqlstate, sqlerrm;
  end if;
  raise notice 'ok - %', message;
end;
$$;

-- True when the current role gets no rows back, whether because a policy hides
-- them or because the role has no privilege on the table at all.
create or replace function pg_temp.sees_nothing(query text) returns boolean language plpgsql as $$
declare
  n bigint;
begin
  execute format('select count(*) from (%s) q', query) into n;
  return n = 0;
exception when insufficient_privilege then
  return true;
end;
$$;

-- True when the statement (an INSERT … RETURNING, like the app sends) hands back one row.
create or replace function pg_temp.returns_row(statement text) returns boolean language plpgsql as $$
declare
  r record;
  n bigint;
begin
  execute statement into r;
  get diagnostics n = row_count;
  return n = 1;
end;
$$;

create or replace function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), false);
end;
$$;

-- Three people: Ana owns a store, Beto sells on his own, Carla browses.
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '{"full_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', '{"full_name": "Beto"}'),
  ('00000000-0000-0000-0000-00000000000c', '{}');

select pg_temp.expect((select count(*) = 3 from public.profiles), 'a profile is created for every new user');
select pg_temp.expect((select full_name = 'Ana' from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'profile takes the name from sign-up metadata');

-- ---------------------------------------------------------------- stores
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
set role authenticated;

insert into public.stores (slug, name, category, province_id, municipality_id, whatsapp, payment, delivery)
values ('mercado-el-sol', 'Mercado El Sol', 'alimentos', 'la-habana', 'plaza-de-la-revolucion', '+5352456789', '{cash,transfer}', '{pickup,delivery}');

select pg_temp.expect(
  (select role = 'owner' from public.store_members m join public.stores s on s.id = m.store_id
   where s.slug = 'mercado-el-sol' and m.user_id = '00000000-0000-0000-0000-00000000000a'),
  'the creator becomes the store owner');

select pg_temp.expect_error(
  $$insert into public.stores (slug, name, category, province_id, municipality_id, whatsapp, verified)
    values ('falsa', 'Falsa', 'hogar', 'la-habana', 'playa', '+5350000000', true)$$,
  '42501', 'a store cannot mark itself as verified');

select pg_temp.expect_error(
  $$insert into public.stores (slug, name, category, province_id, municipality_id, whatsapp)
    values ('mal-lugar', 'Mal lugar', 'hogar', 'la-habana', 'vinales', '+5350000000')$$,
  '23503', 'the municipality must belong to the province');

select pg_temp.expect_error(
  $$update public.stores set plan = 'negocio' where slug = 'mercado-el-sol'$$,
  '42501', 'a store cannot upgrade its own plan');

-- ---------------------------------------------------------------- products
insert into public.products (owner_store_id, title, description, category, price, sale_mode, province_id, municipality_id)
select id, 'Aceite vegetal 1 L', 'Aceite de 1 litro', 'alimentos', 650, 'unit_and_bulk', 'la-habana', 'plaza-de-la-revolucion'
from public.stores where slug = 'mercado-el-sol';

insert into public.quantity_tiers (product_id, min_qty, unit_price)
select id, q, p from public.products, (values (6, 620), (12, 590)) t(q, p) where title = 'Aceite vegetal 1 L';

insert into public.products (owner_store_id, title, category, price, availability, province_id, municipality_id)
select id, 'Café molido 250 g', 'alimentos', 900, 'hidden', 'la-habana', 'plaza-de-la-revolucion'
from public.stores where slug = 'mercado-el-sol';

select pg_temp.expect_error(
  $$insert into public.products (owner_store_id, title, category, price, availability, province_id, municipality_id)
    select id, 'Arroz', 'alimentos', 380, 'sold', 'la-habana', 'playa' from public.stores where slug = 'mercado-el-sol'$$,
  '23514', 'store products use stock states, not "sold"');

-- Beto sells a bicycle on his own.
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
set role authenticated;

insert into public.products (owner_user_id, title, category, condition, price, currency, province_id, municipality_id, whatsapp, payment, delivery)
values ('00000000-0000-0000-0000-00000000000b', 'Bicicleta de paseo', 'vehiculos', 'used', 180, 'USD', 'la-habana', 'playa', '+5350000201', '{cash}', '{pickup}');

select pg_temp.expect_error(
  $$insert into public.products (owner_user_id, title, category, price, province_id, municipality_id)
    values ('00000000-0000-0000-0000-00000000000b', 'Sin contacto', 'otros', 10, 'la-habana', 'playa')$$,
  '23514', 'a personal listing needs WhatsApp, payment and delivery');

select pg_temp.expect_error(
  $$insert into public.products (owner_user_id, title, category, price, province_id, municipality_id, whatsapp, payment, delivery)
    values ('00000000-0000-0000-0000-00000000000a', 'Suplantación', 'otros', 10, 'la-habana', 'playa', '+5350000000', '{cash}', '{pickup}')$$,
  '42501', 'nobody can publish in someone else''s name');

select pg_temp.expect_error(
  $$insert into public.products (owner_store_id, title, category, price, province_id, municipality_id)
    select id, 'Intruso', 'otros', 10, 'la-habana', 'playa' from public.stores where slug = 'mercado-el-sol'$$,
  '42501', 'only store members can publish for the store');

update public.products set price = 1 where title = 'Aceite vegetal 1 L';
select pg_temp.expect((select price = 650 from public.products where title = 'Aceite vegetal 1 L'), 'others cannot change a store''s prices');

delete from public.quantity_tiers;
reset role;
select pg_temp.expect((select count(*) = 2 from public.quantity_tiers), 'others cannot delete a product''s price tiers');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
set role authenticated;
select pg_temp.expect_error(
  $$update public.products set owner_user_id = '00000000-0000-0000-0000-00000000000a' where title = 'Bicicleta de paseo'$$,
  '42501', 'a listing cannot be handed to another owner');

-- ---------------------------------------------------------------- visibility
reset role;
select pg_temp.act_as(null);
set role anon;
select pg_temp.expect((select count(*) = 2 from public.products), 'visitors see published products only (hidden ones excluded)');
select pg_temp.expect((select count(*) = 2 from public.quantity_tiers), 'visitors see the price tiers of visible products');
select pg_temp.expect((select count(*) = 168 from public.municipalities), 'visitors can read the 168 municipalities');
select pg_temp.expect(pg_temp.sees_nothing('select * from public.store_members'), 'visitors cannot list store teams');
select pg_temp.expect_error($$insert into public.favorites (product_id) select id from public.products limit 1$$, '42501', 'visitors cannot save favorites');

select pg_temp.expect(
  (select count(*) = 0 from public.products where search @@ plainto_tsquery('spanish', public.f_unaccent('cafe'))),
  'hidden products stay out of search');

reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
set role authenticated;
select pg_temp.expect((select count(*) = 3 from public.products), 'the owner also sees her hidden product');
select pg_temp.expect(
  (select title = 'Café molido 250 g' from public.products where search @@ plainto_tsquery('spanish', public.f_unaccent('cafe'))),
  'search ignores accents');

-- ---------------------------------------------------------------- team
insert into public.store_members (store_id, user_id, role)
select id, '00000000-0000-0000-0000-00000000000b', 'admin' from public.stores where slug = 'mercado-el-sol';

reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
set role authenticated;
update public.products set price = 700 where title = 'Aceite vegetal 1 L';
select pg_temp.expect((select price = 700 from public.products where title = 'Aceite vegetal 1 L'), 'an admin can edit the store''s products');
select pg_temp.expect_error(
  $$insert into public.store_members (store_id, user_id) select id, '00000000-0000-0000-0000-00000000000c' from public.stores where slug = 'mercado-el-sol'$$,
  '42501', 'admins cannot add people to the team; only owners can');

-- ---------------------------------------------------------------- profiles
update public.profiles set full_name = 'Beto R.' where id = '00000000-0000-0000-0000-00000000000b';
select pg_temp.expect((select full_name = 'Beto R.' from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), 'people edit their own profile');
update public.profiles set full_name = 'Hackeada' where id = '00000000-0000-0000-0000-00000000000a';
select pg_temp.expect((select full_name = 'Ana' from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'nobody edits someone else''s profile');
select pg_temp.expect_error($$update public.profiles set plan = 'pro' where id = '00000000-0000-0000-0000-00000000000b'$$, '42501', 'people cannot change their plan');
select pg_temp.expect_error($$update public.profiles set verified = true where id = '00000000-0000-0000-0000-00000000000b'$$, '42501', 'people cannot verify themselves');

-- ---------------------------------------------------------------- favorites and reports
insert into public.favorites (product_id) select id from public.products where title = 'Aceite vegetal 1 L';
insert into public.reports (product_id, reason) select id, 'wrong_info' from public.products where title = 'Aceite vegetal 1 L';
select pg_temp.expect(pg_temp.sees_nothing('select * from public.reports'), 'reports are not readable from the app');

reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
set role authenticated;
select pg_temp.expect(pg_temp.sees_nothing('select * from public.favorites'), 'favorites are private');

-- ---------------------------------------------------------------- plan limit
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
set role authenticated;
insert into public.products (owner_user_id, title, category, price, province_id, municipality_id, whatsapp, payment, delivery)
select '00000000-0000-0000-0000-00000000000c', 'Artículo ' || n, 'otros', 100, 'holguin', 'moa', '+5350000300', '{cash}', '{pickup}'
from generate_series(1, 10) n;
select pg_temp.expect_error(
  $$insert into public.products (owner_user_id, title, category, price, province_id, municipality_id, whatsapp, payment, delivery)
    values ('00000000-0000-0000-0000-00000000000c', 'Artículo 11', 'otros', 100, 'holguin', 'moa', '+5350000300', '{cash}', '{pickup}')$$,
  'P0001', 'the free plan allows 10 active listings');
update public.products set availability = 'sold' where title = 'Artículo 1';
insert into public.products (owner_user_id, title, category, price, province_id, municipality_id, whatsapp, payment, delivery)
values ('00000000-0000-0000-0000-00000000000c', 'Artículo 11', 'otros', 100, 'holguin', 'moa', '+5350000300', '{cash}', '{pickup}');
select pg_temp.expect(true, 'marking a listing as sold frees a slot');
select pg_temp.expect_error(
  $$update public.products set availability = 'available' where title = 'Artículo 1'$$,
  'P0001', 'relisting over the limit is blocked too');

-- ---------------------------------------------------------------- freshness
reset role;
update public.products set confirmed_at = now() - interval '3 days' where title = 'Bicicleta de paseo';
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
set role authenticated;
update public.products set availability = 'reserved' where title = 'Bicicleta de paseo';
select pg_temp.expect((select confirmed_at > now() - interval '1 minute' from public.products where title = 'Bicicleta de paseo'), 'changing availability refreshes "confirmado hace…"');

-- ---------------------------------------------------------------- suspended store
reset role;
update public.stores set status = 'suspended' where slug = 'mercado-el-sol';
select pg_temp.act_as(null);
set role anon;
select pg_temp.expect((select count(*) = 0 from public.stores where slug = 'mercado-el-sol'), 'a suspended store disappears for visitors');
select pg_temp.expect((select count(*) = 0 from public.products where title = 'Aceite vegetal 1 L'), '…and so do its products');
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
set role authenticated;
select pg_temp.expect((select count(*) = 1 from public.stores where slug = 'mercado-el-sol'), 'its team still sees it');

-- ---------------------------------------------------------------- what the app sends
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
set role authenticated;
update public.profiles set full_name = 'Carla Díaz' where id = '00000000-0000-0000-0000-00000000000c';
select pg_temp.expect((select full_name = 'Carla Díaz' from public.profiles where id = '00000000-0000-0000-0000-00000000000c'), 'a new account can set its name');
select pg_temp.expect(
  pg_temp.returns_row($$insert into public.stores (slug, name, category, province_id, municipality_id, whatsapp, payment, delivery)
    values ('tienda-de-carla', 'Tienda de Carla', 'hogar', 'holguin', 'moa', '+5350000300', '{cash}', '{pickup}') returning id, slug$$),
  'creating a store hands back its id and slug');
select pg_temp.expect(
  pg_temp.returns_row($$insert into public.products (owner_store_id, title, category, price, province_id, municipality_id)
    select id, 'Ventilador de pie', 'hogar', 5000, 'holguin', 'moa' from public.stores where slug = 'tienda-de-carla' returning id$$),
  'publishing as your store hands back the product id');
update public.stores set logo_path = '00000000-0000-0000-0000-00000000000c/logo.webp' where slug = 'tienda-de-carla';
select pg_temp.expect((select logo_path is not null from public.stores where slug = 'tienda-de-carla'), 'the owner can set the store logo');
delete from public.products where title = 'Ventilador de pie';
select pg_temp.expect((select count(*) = 0 from public.products where title = 'Ventilador de pie'), 'a failed publication can be undone');

-- ---------------------------------------------------------------- managing your listings
reset role;
update public.products set confirmed_at = now() - interval '10 days' where title = 'Artículo 2';
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
set role authenticated;
update public.products set confirmed_at = now() where title = 'Artículo 2';
select pg_temp.expect((select confirmed_at > now() - interval '1 minute' from public.products where title = 'Artículo 2'), '"Sigue disponible" refreshes the confirmation date');
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
update public.products set price = 1, availability = 'sold' where title = 'Artículo 2';
delete from public.products where title = 'Artículo 2';
reset role;
select pg_temp.expect((select price = 100 and availability = 'available' from public.products where title = 'Artículo 2'), 'nobody changes or deletes someone else''s listing');

-- ---------------------------------------------------------------- photo storage
reset role;
select pg_temp.expect(
  (select count(*) = 2 from storage.buckets where id in ('product-images', 'store-logos') and public),
  'photo buckets exist and are public');
insert into storage.buckets (id, name) values ('privado', 'privado');
insert into storage.objects (bucket_id, name, owner_id)
values ('product-images', '00000000-0000-0000-0000-00000000000b/p1/0-beto.webp', '00000000-0000-0000-0000-00000000000b');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
set role authenticated;
insert into storage.objects (bucket_id, name, owner_id)
values ('product-images', '00000000-0000-0000-0000-00000000000c/p9/0-carla.webp', '00000000-0000-0000-0000-00000000000c');
select pg_temp.expect(true, 'people upload photos into their own folder');
select pg_temp.expect_error(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('product-images', '00000000-0000-0000-0000-00000000000b/p1/0-intruso.webp', '00000000-0000-0000-0000-00000000000c')$$,
  '42501', 'nobody uploads into someone else''s folder');
select pg_temp.expect_error(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('privado', '00000000-0000-0000-0000-00000000000c/x.webp', '00000000-0000-0000-0000-00000000000c')$$,
  '42501', 'buckets other than NODO''s photo buckets stay closed');
select pg_temp.expect(pg_temp.sees_nothing($$select 1 from storage.objects where name like '00000000-0000-0000-0000-00000000000b/%'$$), 'nobody lists someone else''s uploads');
delete from storage.objects where name like '00000000-0000-0000-0000-00000000000b/%';
delete from storage.objects where name like '00000000-0000-0000-0000-00000000000c/%';
reset role;
select pg_temp.expect((select count(*) = 1 from storage.objects where name like '00000000-0000-0000-0000-00000000000b/%'), 'nobody deletes someone else''s photos');
select pg_temp.expect((select count(*) = 0 from storage.objects where name like '00000000-0000-0000-0000-00000000000c/%'), 'people delete their own photos');

select pg_temp.act_as(null);
set role anon;
select pg_temp.expect_error(
  $$insert into storage.objects (bucket_id, name) values ('product-images', 'anon/x.webp')$$,
  '42501', 'visitors without an account cannot upload');

reset role;
\echo 'All database tests passed.'
