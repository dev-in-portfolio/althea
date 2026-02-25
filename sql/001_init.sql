create extension if not exists pgcrypto;

create table if not exists chains (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  title text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists chain_nodes (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  user_key text not null,
  label text not null,
  weight int not null default 3,
  created_at timestamptz not null default now(),
  unique(chain_id, label)
);

create table if not exists chain_edges (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  user_key text not null,
  from_node_id uuid not null references chain_nodes(id) on delete cascade,
  to_node_id uuid not null references chain_nodes(id) on delete cascade,
  strength int not null default 3,
  created_at timestamptz not null default now(),
  constraint edge_no_self check (from_node_id <> to_node_id),
  unique(chain_id, from_node_id, to_node_id)
);

create table if not exists chain_insights (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  user_key text not null,
  payload jsonb not null,
  computed_at timestamptz not null default now()
);

create index if not exists idx_chains_user_time on chains(user_key, created_at desc);
create index if not exists idx_nodes_chain on chain_nodes(chain_id);
create index if not exists idx_edges_chain on chain_edges(chain_id);
create index if not exists idx_insights_chain_time on chain_insights(chain_id, computed_at desc);
