create extension if not exists pgcrypto;

create table if not exists cache_entries (
  id uuid primary key default gen_random_uuid(),
  namespace text not null,
  cache_key text not null,
  payload jsonb not null,
  payload_bytes int not null,
  content_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(namespace, cache_key)
);

create index if not exists idx_cache_expires on cache_entries(expires_at);
create index if not exists idx_cache_namespace on cache_entries(namespace);
