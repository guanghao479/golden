create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  title text,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  location_name text,
  address text,
  website text,
  tags text[] not null default '{}'::text[],
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists events_approved_idx on public.events (approved);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  name text,
  description text,
  category text,
  address text,
  website text,
  family_friendly boolean not null default false,
  tags text[] not null default '{}'::text[],
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists places_approved_idx on public.places (approved);
