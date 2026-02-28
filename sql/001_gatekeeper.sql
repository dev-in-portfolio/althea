create extension if not exists pgcrypto;

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  label text not null default '',
  scopes text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists rate_limits (
  token_hash text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key(token_hash, window_start)
);
