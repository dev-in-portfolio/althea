create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  device_key text unique not null,
  created_at timestamptz default now()
);

create table if not exists timer_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  duration_seconds integer not null,
  color text not null default '#ffffff',
  created_at timestamptz default now()
);

create table if not exists timer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  preset_id uuid null references timer_presets(id) on delete set null,
  label text not null default '',
  duration_seconds integer not null,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'pending',
  position integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_timer_sessions_user
  on timer_sessions(user_id, created_at desc);
