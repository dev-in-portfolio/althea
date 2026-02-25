create table if not exists favorites (
  user_key text not null,
  exhibit_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_key, exhibit_slug)
);

create table if not exists recent_views (
  user_key text not null,
  exhibit_slug text not null,
  last_viewed timestamptz not null default now(),
  primary key (user_key, exhibit_slug)
);

create index if not exists favorites_user_key_idx on favorites (user_key);
create index if not exists recent_views_user_key_idx on recent_views (user_key);
create index if not exists recent_views_last_viewed_idx on recent_views (last_viewed desc);
