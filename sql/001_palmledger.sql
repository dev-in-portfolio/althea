create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  device_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists ledger_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  kind text not null default 'generic',
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category_id uuid null references ledger_categories(id) on delete set null,
  title text not null default '',
  amount_num numeric(12,2) null,
  amount_unit text not null default '',
  occurred_at timestamptz not null default now(),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_ledger_entries_user_time
  on ledger_entries(user_id, occurred_at desc);

create index if not exists idx_ledger_categories_user
  on ledger_categories(user_id, name);
