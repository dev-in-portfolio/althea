create extension if not exists pgcrypto;

create table if not exists diff_jobs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_field text not null,
  created_at timestamptz not null default now()
);

create table if not exists diff_snapshots (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references diff_jobs(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists diff_records (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references diff_snapshots(id) on delete cascade,
  record_key text not null,
  record_hash text not null,
  record_json jsonb not null
);

create index if not exists idx_diff_records_key on diff_records(record_key);
create index if not exists idx_diff_records_snapshot on diff_records(snapshot_id);

create table if not exists diff_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references diff_jobs(id) on delete cascade,
  base_snapshot uuid not null,
  compare_snapshot uuid not null,
  added jsonb not null default '[]',
  removed jsonb not null default '[]',
  modified jsonb not null default '[]',
  created_at timestamptz not null default now()
);
