create extension if not exists pgcrypto;

create table if not exists surface_recipes (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  name text not null,
  settings jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_surface_recipes_user_time
  on surface_recipes(user_key, created_at desc);

create or replace function set_surface_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_surface_updated_at on surface_recipes;
create trigger set_surface_updated_at
before update on surface_recipes
for each row
execute function set_surface_updated_at();
