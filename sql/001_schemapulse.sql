create extension if not exists pgcrypto;

create table if not exists migration_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists migrations (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references migration_sets(id) on delete cascade,
  filename text not null,
  sql_text text not null,
  created_at timestamptz not null default now(),
  unique(set_id, filename)
);
