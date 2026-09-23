-- Minimal stand-in for the parts of Supabase the migrations rely on (roles,
-- auth.users, auth.uid(), the extensions schema, Storage tables and default
-- grants), so the schema and its policies can be tested on plain PostgreSQL in CI.
-- Never run this against a real Supabase project.

do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end
$$;

create schema if not exists auth;
create schema if not exists extensions;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  phone text,
  raw_user_meta_data jsonb not null default '{}'
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema auth, extensions to anon, authenticated, service_role;
grant usage on schema public to service_role;

-- Storage: the columns the migrations and tests touch, with RLS on and the
-- grants Supabase gives the API roles.
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key,
  name text not null unique,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner_id text,
  created_at timestamptz default now(),
  unique (bucket_id, name)
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text)
returns text[]
language plpgsql
as $$
declare
  _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end;
$$;

grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.objects to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;

-- Projects differ: some grant the API roles everything on new tables, some
-- grant nothing. The tests run both ways (scripts/test-db.sh DEFAULT_GRANTS).
\if :default_grants
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
\endif
