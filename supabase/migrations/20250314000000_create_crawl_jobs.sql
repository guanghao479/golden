create table if not exists public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  firecrawl_job_id text not null,
  source_url text not null,
  crawl_type text not null check (crawl_type in ('events', 'places')),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_crawl_jobs_status on public.crawl_jobs(status);

alter table public.crawl_jobs enable row level security;

create policy "Authenticated can manage crawl jobs"
on public.crawl_jobs
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
