create extension if not exists pgcrypto;

create table if not exists timeslice_projects (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists timeslice_frames (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references timeslice_projects(id) on delete cascade,
  user_key text not null,
  order_index int not null,
  title text not null default '',
  body text not null,
  image_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, order_index)
);

create index if not exists idx_timeslice_projects_user_time
  on timeslice_projects(user_key, created_at desc);

create index if not exists idx_timeslice_frames_project_order
  on timeslice_frames(project_id, order_index asc);

create or replace function set_timeslice_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timeslice_updated_at on timeslice_frames;
create trigger set_timeslice_updated_at
before update on timeslice_frames
for each row
execute function set_timeslice_updated_at();
