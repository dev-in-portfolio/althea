create extension if not exists pgcrypto;

create table if not exists patch_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists patch_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references patch_projects(id) on delete cascade,
  path text not null,
  content text not null,
  updated_at timestamptz not null default now(),
  unique(project_id, path)
);

create table if not exists patches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references patch_projects(id) on delete cascade,
  file_path text not null,
  find_text text not null,
  replace_text text not null,
  status text not null default 'draft' check (status in ('draft','approved','applied')),
  created_at timestamptz not null default now()
);

create index if not exists idx_patches_project_status on patches(project_id, status);
