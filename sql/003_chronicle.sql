create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  device_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists timelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists timeline_layers (
  id uuid primary key default gen_random_uuid(),
  timeline_id uuid not null references timelines(id) on delete cascade,
  name text not null,
  color text not null default '#888888',
  sort_order int not null default 0
);

create table if not exists timeline_events (
  id uuid primary key default gen_random_uuid(),
  timeline_id uuid not null references timelines(id) on delete cascade,
  layer_id uuid references timeline_layers(id) on delete set null,
  title text not null,
  description text not null default '',
  start_time timestamptz not null,
  end_time timestamptz,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_time on timeline_events(start_time);
create index if not exists idx_events_timeline on timeline_events(timeline_id);
create index if not exists idx_events_tags on timeline_events using gin(tags);
