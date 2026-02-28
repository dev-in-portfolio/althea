create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null default '',
  tags text[] not null default '{}',
  body text not null,
  created_at timestamptz not null default now()
);

alter table chunks
  add column if not exists body_tsv tsvector
  generated always as (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))) stored;

create index if not exists idx_chunks_tsv on chunks using gin(body_tsv);
create index if not exists idx_chunks_tags_gin on chunks using gin(tags);
create index if not exists idx_chunks_title_trgm on chunks using gin(title gin_trgm_ops);
