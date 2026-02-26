create extension if not exists pgcrypto;

create table if not exists schemas (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  name text not null,
  version int not null default 1,
  schema jsonb not null,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_key, name, version)
);

create table if not exists validation_runs (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  schema_name text not null,
  schema_version int not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_schemas_user_name on schemas(user_key, name);
create index if not exists idx_validation_runs_user_time on validation_runs(user_key, created_at desc);
create index if not exists idx_validation_runs_schema on validation_runs(user_key, schema_name, schema_version);
