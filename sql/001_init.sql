create extension if not exists pgcrypto;

create table if not exists compression_runs (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  original text not null,
  options jsonb not null default '{}'::jsonb,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_compression_runs_user_time
  on compression_runs(user_key, created_at desc);
