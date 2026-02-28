create extension if not exists pgcrypto;

create table if not exists flow_events (
  id uuid primary key default gen_random_uuid(),
  entity_id text not null,
  stage text not null,
  entered_at timestamptz not null,
  exited_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_flow_entity on flow_events(entity_id);
create index if not exists idx_flow_stage on flow_events(stage);
create index if not exists idx_flow_time on flow_events(entered_at);
