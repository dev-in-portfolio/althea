create extension if not exists pgcrypto;

create table if not exists benefit_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists benefit_lines (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references benefit_models(id) on delete cascade,
  benefit_type text not null,
  amount numeric(12,2) not null,
  unit text not null,
  max_units int not null default 1,
  waiting_days int not null default 0,
  is_enabled boolean not null default true
);

create index if not exists idx_lines_model on benefit_lines(model_id);

create table if not exists claim_scenarios (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references benefit_models(id) on delete cascade,
  name text not null,
  inputs jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_scenarios_model on claim_scenarios(model_id);
