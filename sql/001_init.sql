create extension if not exists pgcrypto;

create type public.edge_kind as enum ('parent','often_with','opposite');

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  color text not null default '#444444',
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.tag_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  from_tag uuid not null references public.tags(id) on delete cascade,
  to_tag uuid not null references public.tags(id) on delete cascade,
  kind public.edge_kind not null,
  weight smallint not null default 1,
  created_at timestamptz not null default now(),
  unique(user_id, from_tag, to_tag, kind)
);

create table if not exists public.things (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text not null default '',
  url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.thing_tags (
  thing_id uuid not null references public.things(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (thing_id, tag_id)
);

create index if not exists idx_tags_user on public.tags(user_id, name);
create index if not exists idx_edges_user_from on public.tag_edges(user_id, from_tag);
create index if not exists idx_things_user_time on public.things(user_id, created_at desc);

alter table public.tags enable row level security;
alter table public.tag_edges enable row level security;
alter table public.things enable row level security;
alter table public.thing_tags enable row level security;

create policy "tags_rw_own" on public.tags
for all using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "edges_rw_own" on public.tag_edges
for all using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "things_rw_own" on public.things
for all using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "thing_tags_select_own" on public.thing_tags
for select using (
  exists (select 1 from public.things t where t.id = thing_id and t.user_id = auth.uid())
  and
  exists (select 1 from public.tags g where g.id = tag_id and g.user_id = auth.uid())
);

create policy "thing_tags_insert_own" on public.thing_tags
for insert with check (
  exists (select 1 from public.things t where t.id = thing_id and t.user_id = auth.uid())
  and
  exists (select 1 from public.tags g where g.id = tag_id and g.user_id = auth.uid())
);

create policy "thing_tags_delete_own" on public.thing_tags
for delete using (
  exists (select 1 from public.things t where t.id = thing_id and t.user_id = auth.uid())
);

create or replace function public.tag_neighborhood(p_tag uuid, p_hops int default 2)
returns table(tag_id uuid, depth int)
language sql
security definer
as $$
  with recursive walk(tag_id, depth) as (
    select p_tag, 0
    union all
    select e.to_tag, w.depth + 1
    from walk w
    join public.tag_edges e on e.from_tag = w.tag_id
    where w.depth < p_hops
      and e.user_id = auth.uid()
  )
  select distinct tag_id, min(depth) as depth
  from walk
  group by tag_id
  order by min(depth), tag_id;
$$;

revoke all on function public.tag_neighborhood(uuid,int) from public;
grant execute on function public.tag_neighborhood(uuid,int) to authenticated;
