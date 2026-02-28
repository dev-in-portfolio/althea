create extension if not exists pgcrypto;

create table if not exists config_snapshots (
  id uuid primary key default gen_random_uuid(),
  env text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists config_items (
  snapshot_id uuid not null references config_snapshots(id) on delete cascade,
  key text not null,
  value text not null,
  value_hash text not null,
  primary key(snapshot_id, key)
);

create index if not exists idx_cfg_env_time on config_snapshots(env, created_at desc);
create index if not exists idx_cfg_key on config_items(key);
