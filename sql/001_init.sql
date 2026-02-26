create extension if not exists pgcrypto;

create table if not exists momentum_sessions (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  tag text not null,
  feel smallint not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint duration_bounds check (duration_seconds > 0 and duration_seconds <= 86400),
  constraint feel_bounds check (feel in (-1, 0, 1)),
  constraint tag_length check (char_length(tag) between 1 and 40),
  constraint start_before_end check (started_at < ended_at)
);

create index if not exists momentum_sessions_user_started_idx
  on momentum_sessions (user_key, started_at desc);

create index if not exists momentum_sessions_user_feel_idx
  on momentum_sessions (user_key, feel);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists momentum_sessions_set_updated_at on momentum_sessions;
create trigger momentum_sessions_set_updated_at
  before update on momentum_sessions
  for each row
  execute procedure set_updated_at();
