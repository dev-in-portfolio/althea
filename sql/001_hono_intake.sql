create extension if not exists pgcrypto;

create table if not exists intake_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  external_id text not null default '',
  content jsonb not null,
  content_hash text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists intake_quarantine (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  external_id text not null default '',
  raw_content jsonb not null,
  errors text[] not null,
  content_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_intake_kind_time on intake_records(kind, created_at desc);
create index if not exists idx_quarantine_kind_time on intake_quarantine(kind, created_at desc);
