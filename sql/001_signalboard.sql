create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  device_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  kind text not null default 'generic',
  status text not null default 'ok' check (status in ('ok','warn','bad')),
  note text not null default '',
  value_num numeric(14,4) null,
  value_unit text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists signal_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  signal_id uuid not null references signals(id) on delete cascade,
  warn_if_gt numeric(14,4) null,
  warn_if_lt numeric(14,4) null,
  bad_if_gt numeric(14,4) null,
  bad_if_lt numeric(14,4) null,
  created_at timestamptz not null default now(),
  unique(user_id, signal_id)
);

create index if not exists idx_signals_user_status on signals(user_id, status);
create index if not exists idx_signals_user_updated on signals(user_id, updated_at desc);
