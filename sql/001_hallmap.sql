create extension if not exists pgcrypto;

create table if not exists wings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists halls (
  id uuid primary key default gen_random_uuid(),
  wing_id uuid not null references wings(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique(wing_id, slug),
  unique(wing_id, name)
);

create table if not exists exhibits (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references halls(id) on delete cascade,
  title text not null,
  slug text not null,
  summary text not null,
  tags text[] not null default '{}',
  body text not null,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(hall_id, slug)
);

create index if not exists idx_halls_wing on halls(wing_id);
create index if not exists idx_exhibits_hall on exhibits(hall_id);
create index if not exists idx_exhibits_tags_gin on exhibits using gin(tags);
