create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  device_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists forms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft','published')),
  public_slug text null unique,
  schema jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists form_responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references forms(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  response jsonb not null,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_forms_user on forms(user_id, updated_at desc);
create index if not exists idx_responses_form on form_responses(form_id, submitted_at desc);
