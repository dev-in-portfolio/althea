create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  device_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  deck_id uuid not null references decks(id) on delete cascade,
  front text not null,
  back text not null,
  tags text[] not null default '{}',
  ease numeric(4,2) not null default 2.50,
  interval_days int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cards_user_deck_due
  on cards(user_id, deck_id, due_at asc);

create index if not exists idx_cards_user_due
  on cards(user_id, due_at asc);

create index if not exists idx_cards_tags_gin
  on cards using gin(tags);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  deck_id uuid not null references decks(id) on delete cascade,
  rating text not null check (rating in ('again','hard','good','easy')),
  reviewed_at timestamptz not null default now(),
  prev_due_at timestamptz null,
  next_due_at timestamptz not null
);

create index if not exists idx_reviews_user_time
  on reviews(user_id, reviewed_at desc);

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_cards_touch on cards;
create trigger trg_cards_touch
before update on cards
for each row execute function touch_updated_at();
