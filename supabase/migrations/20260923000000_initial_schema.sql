-- NODO · initial schema
--
-- Principles from the product spec that the schema enforces:
--   * An account is always a person (profiles). Stores are separate entities
--     linked through store_members, so a person can run several stores and a
--     store can have several admins.
--   * One listing = one product. A product belongs to exactly one person or
--     one store; store products inherit contact/payment/delivery from the store.
--   * "Mayorista" is a sale mode of the product (quantity tiers), not an
--     account type.
--   * Plans limit active personal listings; sold/archived ones don't count.
--
-- Everything is protected by row level security; the browser only ever gets
-- the rows a policy allows.

create extension if not exists unaccent with schema extensions;

-- Accent-insensitive search ("cafe" finds "Café"). unaccent() itself is not
-- immutable, so it can't feed a generated column without this wrapper.
create or replace function public.f_unaccent(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, value) $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reference data (rows are loaded by the next migration)
-- ---------------------------------------------------------------------------

create table public.provinces (
  id text primary key,
  name text not null unique,
  position smallint not null unique
);

create table public.municipalities (
  province_id text not null references public.provinces on delete restrict,
  id text not null,
  name text not null,
  primary key (province_id, id)
);

create table public.categories (
  id text primary key,
  label text not null,
  position smallint not null unique
);

-- ---------------------------------------------------------------------------
-- People and stores
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_path text,
  province_id text references public.provinces,
  municipality_id text,
  plan text not null default 'gratis' check (plan in ('gratis', 'pro', 'negocio')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (province_id, municipality_id) references public.municipalities (province_id, id)
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 70),
  name text not null check (char_length(name) between 2 and 60),
  logo_path text,
  category text not null references public.categories,
  description text not null default '' check (char_length(description) <= 200),
  province_id text not null references public.provinces,
  municipality_id text not null,
  address text check (char_length(address) <= 160),
  -- E.164 without spaces, e.g. +5352456789
  whatsapp text not null check (whatsapp ~ '^\+[0-9]{7,15}$'),
  hours text check (char_length(hours) <= 80),
  payment text[] not null default '{cash}'
    check (cardinality(payment) > 0 and payment <@ array['cash', 'transfer']),
  delivery text[] not null default '{pickup}'
    check (cardinality(delivery) > 0 and delivery <@ array['pickup', 'delivery']),
  delivery_note text check (char_length(delivery_note) <= 160),
  plan text not null default 'gratis' check (plan in ('gratis', 'pro', 'negocio')),
  status text not null default 'active' check (status in ('active', 'paused', 'suspended')),
  verified boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (province_id, municipality_id) references public.municipalities (province_id, id)
);

create index stores_area_idx on public.stores (province_id, municipality_id) where status = 'active';

create table public.store_members (
  store_id uuid not null references public.stores on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create index store_members_user_idx on public.store_members (user_id);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles on delete cascade,
  owner_store_id uuid references public.stores on delete cascade,
  created_by uuid not null default auth.uid() references public.profiles on delete restrict,
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 600),
  category text not null references public.categories,
  condition text check (condition in ('new', 'used')),
  price numeric(12, 2) not null check (price > 0),
  offer_price numeric(12, 2) check (offer_price > 0 and offer_price < price),
  currency text not null default 'CUP' check (currency in ('CUP', 'USD', 'EUR', 'MLC')),
  sale_mode text not null default 'unit' check (sale_mode in ('unit', 'unit_and_bulk', 'bulk_only')),
  min_qty integer check (min_qty >= 2),
  unit_label text not null default 'unidad' check (char_length(unit_label) between 1 and 20),
  availability text not null default 'available',
  stock_qty integer check (stock_qty >= 0),
  -- "Disponible · confirmado hace 45 min": refreshed whenever the seller confirms.
  confirmed_at timestamptz not null default now(),
  province_id text not null references public.provinces,
  municipality_id text not null,
  -- Store products leave these null and use the store's terms.
  whatsapp text check (whatsapp ~ '^\+[0-9]{7,15}$'),
  payment text[] check (payment is null or (cardinality(payment) > 0 and payment <@ array['cash', 'transfer'])),
  delivery text[] check (delivery is null or (cardinality(delivery) > 0 and delivery <@ array['pickup', 'delivery'])),
  delivery_note text check (char_length(delivery_note) <= 160),
  search tsvector generated always as (
    to_tsvector('spanish', public.f_unaccent(title || ' ' || description))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (province_id, municipality_id) references public.municipalities (province_id, id),
  constraint products_one_owner check (num_nonnulls(owner_user_id, owner_store_id) = 1),
  constraint products_bulk_needs_minimum check (sale_mode <> 'bulk_only' or min_qty is not null),
  -- A person's listing carries its own contact and terms.
  constraint products_person_terms check (
    owner_user_id is null or (whatsapp is not null and payment is not null and delivery is not null)
  ),
  -- People sell items (reserved/sold); stores manage stock (low/out of stock/hidden).
  constraint products_availability check (
    (owner_user_id is not null and availability in ('draft', 'available', 'reserved', 'sold', 'archived'))
    or (owner_store_id is not null and availability in ('available', 'low_stock', 'out_of_stock', 'hidden'))
  )
);

create index products_search_idx on public.products using gin (search);
create index products_area_idx on public.products (province_id, municipality_id, confirmed_at desc);
create index products_store_idx on public.products (owner_store_id) where owner_store_id is not null;
create index products_user_idx on public.products (owner_user_id) where owner_user_id is not null;

create table public.quantity_tiers (
  product_id uuid not null references public.products on delete cascade,
  min_qty integer not null check (min_qty >= 2),
  unit_price numeric(12, 2) not null check (unit_price > 0),
  primary key (product_id, min_qty)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  path text not null,
  position smallint not null check (position between 0 and 5),
  unique (product_id, position)
);

-- ---------------------------------------------------------------------------
-- Personal lists and reports
-- ---------------------------------------------------------------------------

create table public.favorites (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  product_id uuid not null references public.products on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.store_follows (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  store_id uuid not null references public.stores on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles on delete cascade,
  product_id uuid references public.products on delete cascade,
  store_id uuid references public.stores on delete cascade,
  reason text not null check (reason in ('sold', 'fraud', 'prohibited', 'wrong_info', 'other')),
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint reports_one_target check (num_nonnulls(product_id, store_id) = 1)
);

-- ---------------------------------------------------------------------------
-- Helpers used by policies. SECURITY DEFINER so a policy on store_members can
-- ask about store_members without recursing into its own policy.
-- ---------------------------------------------------------------------------

create or replace function public.is_store_member(p_store uuid, p_roles text[] default array['owner', 'admin'])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_members m
    where m.store_id = p_store
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  );
$$;

create or replace function public.can_edit_product(p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    where p.id = p_product
      and (
        p.owner_user_id = (select auth.uid())
        or (p.owner_store_id is not null and public.is_store_member(p.owner_store_id))
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Every new auth user gets a profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 80), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Whoever creates a store becomes its owner.
create or replace function public.add_store_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.store_members (store_id, user_id, role) values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger stores_add_owner
  after insert on public.stores
  for each row execute function public.add_store_owner();

-- Personal listings count against the plan; sold, archived and drafts don't.
create or replace function public.enforce_listing_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  plan_limit integer;
  active_count integer;
begin
  if new.owner_user_id is null or new.availability not in ('available', 'reserved') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.availability in ('available', 'reserved') then
    return new;
  end if;

  select case p.plan when 'pro' then 50 when 'negocio' then 200 else 10 end
    into plan_limit
    from public.profiles p
    where p.id = new.owner_user_id;

  select count(*)
    into active_count
    from public.products
    where owner_user_id = new.owner_user_id
      and availability in ('available', 'reserved')
      and id <> new.id;

  if active_count >= plan_limit then
    raise exception 'listing_limit_reached'
      using detail = format('The %s plan allows %s active listings.', coalesce((select plan from public.profiles where id = new.owner_user_id), 'gratis'), plan_limit),
            hint = 'Mark a listing as sold or archived, or upgrade the plan.';
  end if;
  return new;
end;
$$;

create trigger products_listing_limit
  before insert or update of availability on public.products
  for each row execute function public.enforce_listing_limit();

-- Changing availability counts as confirming it.
create or replace function public.touch_confirmed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.availability is distinct from old.availability then
    new.confirmed_at := now();
  end if;
  return new;
end;
$$;

create trigger products_touch_confirmed
  before update on public.products
  for each row execute function public.touch_confirmed_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger stores_updated_at before update on public.stores
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.provinces enable row level security;
alter table public.municipalities enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.products enable row level security;
alter table public.quantity_tiers enable row level security;
alter table public.product_images enable row level security;
alter table public.favorites enable row level security;
alter table public.store_follows enable row level security;
alter table public.reports enable row level security;

-- Reference data: readable by everyone, written only through migrations.
create policy "reference is public" on public.provinces for select using (true);
create policy "reference is public" on public.municipalities for select using (true);
create policy "reference is public" on public.categories for select using (true);

-- Profiles: public cards (no phone number lives here), each person edits their own.
create policy "profiles are public" on public.profiles for select using (true);
create policy "edit own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Stores: active ones are public; members also see paused/suspended ones.
create policy "active stores are public" on public.stores for select
  using (status = 'active' or public.is_store_member(id));
create policy "create a store" on public.stores for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "members edit their store" on public.stores for update to authenticated
  using (public.is_store_member(id))
  with check (public.is_store_member(id));
create policy "owners delete their store" on public.stores for delete to authenticated
  using (public.is_store_member(id, array['owner']));

-- Members: visible to the store's team; owners manage the team.
create policy "team sees the team" on public.store_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_store_member(store_id));
create policy "owners add members" on public.store_members for insert to authenticated
  with check (public.is_store_member(store_id, array['owner']));
create policy "owners change roles" on public.store_members for update to authenticated
  using (public.is_store_member(store_id, array['owner']))
  with check (public.is_store_member(store_id, array['owner']));
create policy "owners remove members, anyone can leave" on public.store_members for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_store_member(store_id, array['owner']));

-- Products: published ones of active stores (or people) are public; the
-- seller always sees their own, including drafts and hidden ones.
create policy "published products are public" on public.products for select
  using (
    (
      availability not in ('draft', 'hidden', 'archived')
      and (owner_store_id is null or exists (
        select 1 from public.stores s where s.id = owner_store_id and s.status = 'active'
      ))
    )
    or owner_user_id = (select auth.uid())
    or (owner_store_id is not null and public.is_store_member(owner_store_id))
  );
create policy "sell as yourself or as your store" on public.products for insert to authenticated
  with check (
    (owner_user_id = (select auth.uid()) and owner_store_id is null)
    or (owner_user_id is null and public.is_store_member(owner_store_id))
  );
create policy "sellers edit their products" on public.products for update to authenticated
  using (
    owner_user_id = (select auth.uid())
    or (owner_store_id is not null and public.is_store_member(owner_store_id))
  )
  with check (
    owner_user_id = (select auth.uid())
    or (owner_store_id is not null and public.is_store_member(owner_store_id))
  );
create policy "sellers delete their products" on public.products for delete to authenticated
  using (
    owner_user_id = (select auth.uid())
    or (owner_store_id is not null and public.is_store_member(owner_store_id))
  );

-- Tiers and images follow their product.
create policy "follow product visibility" on public.quantity_tiers for select
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "sellers manage tiers" on public.quantity_tiers for all to authenticated
  using (public.can_edit_product(product_id))
  with check (public.can_edit_product(product_id));
create policy "follow product visibility" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "sellers manage images" on public.product_images for all to authenticated
  using (public.can_edit_product(product_id))
  with check (public.can_edit_product(product_id));

-- Personal lists are private.
create policy "own favorites" on public.favorites for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own follows" on public.store_follows for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Reports: anyone signed in can file one; only moderators (service role) read them.
create policy "file a report" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Column privileges: plan, verification, status and ownership are never set
-- from the app. Supabase grants table-wide rights by default, so narrow them.
-- ---------------------------------------------------------------------------

revoke insert, update on public.profiles from anon, authenticated;
grant update (full_name, avatar_path, province_id, municipality_id) on public.profiles to authenticated;

revoke insert, update on public.stores from anon, authenticated;
grant insert (slug, name, logo_path, category, description, province_id, municipality_id, address,
              whatsapp, hours, payment, delivery, delivery_note)
  on public.stores to authenticated;
grant update (name, logo_path, category, description, province_id, municipality_id, address,
              whatsapp, hours, payment, delivery, delivery_note)
  on public.stores to authenticated;

revoke insert, update on public.products from anon, authenticated;
grant insert (owner_user_id, owner_store_id, title, description, category, condition, price, offer_price,
              currency, sale_mode, min_qty, unit_label, availability, stock_qty, province_id,
              municipality_id, whatsapp, payment, delivery, delivery_note)
  on public.products to authenticated;
grant update (title, description, category, condition, price, offer_price, currency, sale_mode, min_qty,
              unit_label, availability, stock_qty, confirmed_at, province_id, municipality_id, whatsapp,
              payment, delivery, delivery_note)
  on public.products to authenticated;

revoke insert, update on public.reports from anon, authenticated;
grant insert (product_id, store_id, reason, details) on public.reports to authenticated;

-- Helpers are for policies, not for calling over the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.add_store_owner() from public, anon, authenticated;
revoke execute on function public.enforce_listing_limit() from public, anon, authenticated;
