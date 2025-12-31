create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  source_url text,
  title text not null,
  description text,
  start_time text,
  end_time text,
  location_name text,
  address text,
  website text,
  tags text[] not null default '{}',
  approved boolean not null default false,
  created_by uuid references auth.users on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  source_url text,
  name text not null,
  description text,
  category text,
  address text,
  website text,
  family_friendly boolean not null default false,
  tags text[] not null default '{}',
  approved boolean not null default false,
  created_by uuid references auth.users on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crawl_sources (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_type text not null check (source_type in ('events', 'places')),
  created_by uuid references auth.users on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at
before update on public.places
for each row
execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.places enable row level security;
alter table public.crawl_sources enable row level security;

create policy "Public can view approved events"
on public.events
for select
using (approved = true);

create policy "Public can view approved places"
on public.places
for select
using (approved = true);

create policy "Authenticated can manage events"
on public.events
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated can manage places"
on public.places
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated can manage crawl sources"
on public.crawl_sources
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
