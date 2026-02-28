create extension if not exists pgcrypto;

create type job_status as enum ('ready','running','done','failed','dead');

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  status job_status not null default 'ready',
  payload jsonb not null,
  priority int not null default 0,
  attempts int not null default 0,
  max_attempts int not null default 5,
  available_at timestamptz not null default now(),
  lease_owner text not null default '',
  lease_until timestamptz null,
  last_error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jobs_ready on jobs(status, available_at, priority desc);
create index if not exists idx_jobs_running on jobs(status, lease_until);
create index if not exists idx_jobs_kind on jobs(kind, created_at desc);
