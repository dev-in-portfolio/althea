create table if not exists favorites (
  user_key text not null,
  term_slug text not null,
  created_at timestamptz default now(),
  primary key (user_key, term_slug)
);

create table if not exists custom_terms (
  id bigserial primary key,
  user_key text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

create index if not exists favorites_user_idx on favorites (user_key);
create index if not exists custom_terms_user_idx on custom_terms (user_key);
