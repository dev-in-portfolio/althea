create extension if not exists pgcrypto;

create table if not exists rulepacks (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  name text not null,
  rules jsonb not null,
  created_at timestamptz not null default now(),
  unique(user_key, name)
);

create table if not exists judge_runs (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  items jsonb not null,
  rules jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rulepacks_user on rulepacks(user_key, name);
create index if not exists idx_judge_runs_user_time on judge_runs(user_key, created_at desc);
