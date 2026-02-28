create extension if not exists pgcrypto;

create table if not exists datasets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists stops (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  name text not null default '',
  address text not null,
  city text not null default '',
  state text not null default '',
  zip text not null default '',
  lat double precision null,
  lon double precision null,
  notes text not null default '',
  source text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_stops_dataset on stops(dataset_id);
create index if not exists idx_stops_address on stops(dataset_id, address);
create index if not exists idx_stops_latlon on stops(dataset_id, lat, lon);
