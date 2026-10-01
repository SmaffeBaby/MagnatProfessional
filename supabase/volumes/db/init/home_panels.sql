create extension if not exists "pgcrypto";

create table if not exists public.home_panels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  slug text not null,
  detail_text text not null default '',
  detail_text_en text,
  mascot_path text,
  mascot_url text,
  sort_order integer not null default 0,
  gradient_from_color text not null default '#DA2128',
  gradient_from_opacity numeric(4, 3) not null default 1,
  gradient_to_color text not null default '#DA2128',
  gradient_to_opacity numeric(4, 3) not null default 0,
  gradient_to_position integer not null default 70,
  image_path text,
  image_url text,
  video_path text,
  video_url text,
  poster_path text,
  poster_url text,
  link_path text not null default '/',
  tile_type text not null default 'wide',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint home_panels_tile_type_check check (tile_type in ('wide', 'vertical')),
  constraint home_panels_gradient_from_color_check check (gradient_from_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint home_panels_gradient_to_color_check check (gradient_to_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint home_panels_gradient_from_opacity_check check (gradient_from_opacity >= 0 and gradient_from_opacity <= 1),
  constraint home_panels_gradient_to_opacity_check check (gradient_to_opacity >= 0 and gradient_to_opacity <= 1),
  constraint home_panels_gradient_to_position_check check (gradient_to_position >= 0 and gradient_to_position <= 100),
  constraint home_panels_link_path_internal_check check (
    link_path ~ '^/' and
    link_path !~ '^//' and
    link_path !~ '://'
  )
);

create unique index if not exists home_panels_slug_unique
  on public.home_panels (slug);

create or replace function public.set_home_panels_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_home_panels_updated_at on public.home_panels;

create trigger set_home_panels_updated_at
before update on public.home_panels
for each row
execute function public.set_home_panels_updated_at();

alter table public.home_panels enable row level security;

drop policy if exists "Home panels are publicly readable." on public.home_panels;
create policy "Home panels are publicly readable."
  on public.home_panels for select
  using (true);

create table if not exists public.portfolio_cards (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid not null references public.home_panels(id) on delete cascade,
  title text not null,
  title_en text,
  slug text not null,
  sort_order integer not null default 0,
  gradient_from_color text not null default '#DA2128',
  gradient_from_opacity numeric(4, 3) not null default 1,
  gradient_to_color text not null default '#DA2128',
  gradient_to_opacity numeric(4, 3) not null default 0,
  gradient_to_position integer not null default 70,
  image_path text,
  image_url text,
  video_path text,
  video_url text,
  poster_path text,
  poster_url text,
  case_hero_path text,
  case_hero_url text,
  tile_type text not null default 'vertical',
  article_blocks jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint portfolio_cards_tile_type_check check (tile_type in ('wide', 'vertical')),
  constraint portfolio_cards_gradient_from_color_check check (gradient_from_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint portfolio_cards_gradient_to_color_check check (gradient_to_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint portfolio_cards_gradient_from_opacity_check check (gradient_from_opacity >= 0 and gradient_from_opacity <= 1),
  constraint portfolio_cards_gradient_to_opacity_check check (gradient_to_opacity >= 0 and gradient_to_opacity <= 1),
  constraint portfolio_cards_gradient_to_position_check check (gradient_to_position >= 0 and gradient_to_position <= 100)
);

create unique index if not exists portfolio_cards_panel_slug_unique
  on public.portfolio_cards (panel_id, slug);

create table if not exists public.portfolio_card_article_blocks (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.portfolio_cards(id) on delete cascade,
  title text not null default '',
  title_en text,
  text text not null default '',
  text_en text,
  layout text not null default 'single-wide',
  images jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint portfolio_card_article_blocks_layout_check
    check (layout in ('single-wide', 'two-medium', 'three-vertical'))
);

create index if not exists portfolio_card_article_blocks_card_sort_idx
  on public.portfolio_card_article_blocks (card_id, sort_order, created_at);

create or replace function public.set_portfolio_cards_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_portfolio_cards_updated_at on public.portfolio_cards;

create trigger set_portfolio_cards_updated_at
before update on public.portfolio_cards
for each row
execute function public.set_portfolio_cards_updated_at();

create or replace function public.set_portfolio_card_article_blocks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_portfolio_card_article_blocks_updated_at on public.portfolio_card_article_blocks;

create trigger set_portfolio_card_article_blocks_updated_at
before update on public.portfolio_card_article_blocks
for each row
execute function public.set_portfolio_card_article_blocks_updated_at();

alter table public.portfolio_cards enable row level security;
alter table public.portfolio_card_article_blocks enable row level security;

drop policy if exists "Portfolio cards are publicly readable." on public.portfolio_cards;
create policy "Portfolio cards are publicly readable."
  on public.portfolio_cards for select
  using (true);

drop policy if exists "Portfolio card article blocks are publicly readable." on public.portfolio_card_article_blocks;
create policy "Portfolio card article blocks are publicly readable."
  on public.portfolio_card_article_blocks for select
  using (true);

create table if not exists public.about_us_content (
  id boolean primary key default true,
  text text not null default '',
  text_en text,
  button_text text not null default '',
  button_text_en text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint about_us_content_singleton_check check (id)
);

insert into public.about_us_content (id, text, text_en, button_text, button_text_en)
values (true, '', null, '', null)
on conflict (id) do nothing;

create or replace function public.set_about_us_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_about_us_content_updated_at on public.about_us_content;

create trigger set_about_us_content_updated_at
before update on public.about_us_content
for each row
execute function public.set_about_us_content_updated_at();

alter table public.about_us_content enable row level security;

drop policy if exists "About us content is publicly readable." on public.about_us_content;
create policy "About us content is publicly readable."
  on public.about_us_content for select
  using (true);

create table if not exists public.description_content (
  id boolean primary key default true,
  text text not null default '',
  text_en text,
  card_text text not null default '',
  card_text_en text,
  desktop_plaque_path text,
  desktop_plaque_url text,
  tablet_plaque_path text,
  tablet_plaque_url text,
  mobile_plaque_path text,
  mobile_plaque_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint description_content_singleton_check check (id)
);

insert into public.description_content (
  id,
  text,
  text_en,
  card_text,
  card_text_en,
  desktop_plaque_path,
  desktop_plaque_url,
  tablet_plaque_path,
  tablet_plaque_url,
  mobile_plaque_path,
  mobile_plaque_url
)
values (true, '', null, '', null, null, null, null, null, null, null)
on conflict (id) do nothing;

create or replace function public.set_description_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_description_content_updated_at on public.description_content;

create trigger set_description_content_updated_at
before update on public.description_content
for each row
execute function public.set_description_content_updated_at();

alter table public.description_content enable row level security;

drop policy if exists "Description content is publicly readable." on public.description_content;
create policy "Description content is publicly readable."
  on public.description_content for select
  using (true);

create table if not exists public.stats_items (
  id uuid primary key default gen_random_uuid(),
  number_text text not null,
  sort_order integer not null default 0,
  text text not null,
  text_en text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_stats_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_stats_items_updated_at on public.stats_items;

create trigger set_stats_items_updated_at
before update on public.stats_items
for each row
execute function public.set_stats_items_updated_at();

alter table public.stats_items enable row level security;

drop policy if exists "Stats items are publicly readable." on public.stats_items;
create policy "Stats items are publicly readable."
  on public.stats_items for select
  using (true);

create table if not exists public.director_text_content (
  id boolean primary key default true,
  text text not null default '',
  text_en text,
  photo_path text,
  photo_url text,
  thumbnail_path text,
  thumbnail_url text,
  name text not null default '',
  name_en text,
  position text not null default '',
  position_en text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint director_text_content_singleton_check check (id)
);

insert into public.director_text_content (
  id,
  text,
  text_en,
  photo_path,
  photo_url,
  thumbnail_path,
  thumbnail_url,
  name,
  name_en,
  position,
  position_en
)
values (true, '', null, null, null, null, null, '', null, '', null)
on conflict (id) do nothing;

create or replace function public.set_director_text_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_director_text_content_updated_at on public.director_text_content;

create trigger set_director_text_content_updated_at
before update on public.director_text_content
for each row
execute function public.set_director_text_content_updated_at();

alter table public.director_text_content enable row level security;

drop policy if exists "Director text content is publicly readable." on public.director_text_content;
create policy "Director text content is publicly readable."
  on public.director_text_content for select
  using (true);

create table if not exists public.hystory_company_items (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  sort_order integer not null default 0,
  title text not null,
  title_en text,
  text text not null,
  text_en text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_hystory_company_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_hystory_company_items_updated_at on public.hystory_company_items;

create trigger set_hystory_company_items_updated_at
before update on public.hystory_company_items
for each row
execute function public.set_hystory_company_items_updated_at();

alter table public.hystory_company_items enable row level security;

drop policy if exists "Hystory company items are publicly readable." on public.hystory_company_items;
create policy "Hystory company items are publicly readable."
  on public.hystory_company_items for select
  using (true);

create table if not exists public.mission_values_content (
  id boolean primary key default true,
  main_text text not null default '',
  main_text_en text,
  main_text_html text not null default '',
  main_text_html_en text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint mission_values_content_singleton_check check (id)
);

insert into public.mission_values_content (
  id,
  main_text,
  main_text_en,
  main_text_html,
  main_text_html_en
)
values (true, '', null, '', null)
on conflict (id) do nothing;

create or replace function public.set_mission_values_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_mission_values_content_updated_at on public.mission_values_content;

create trigger set_mission_values_content_updated_at
before update on public.mission_values_content
for each row
execute function public.set_mission_values_content_updated_at();

alter table public.mission_values_content enable row level security;

drop policy if exists "Mission values content is publicly readable." on public.mission_values_content;
create policy "Mission values content is publicly readable."
  on public.mission_values_content for select
  using (true);

create table if not exists public.mission_values_cards (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  title text not null,
  title_en text,
  text text not null,
  text_en text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_mission_values_cards_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_mission_values_cards_updated_at on public.mission_values_cards;

create trigger set_mission_values_cards_updated_at
before update on public.mission_values_cards
for each row
execute function public.set_mission_values_cards_updated_at();

alter table public.mission_values_cards enable row level security;

drop policy if exists "Mission values cards are publicly readable." on public.mission_values_cards;
create policy "Mission values cards are publicly readable."
  on public.mission_values_cards for select
  using (true);

create table if not exists public.clients_items (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  image_path text,
  image_url text not null,
  link_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_clients_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_clients_items_updated_at on public.clients_items;

create trigger set_clients_items_updated_at
before update on public.clients_items
for each row
execute function public.set_clients_items_updated_at();

alter table public.clients_items enable row level security;

drop policy if exists "Clients items are publicly readable." on public.clients_items;
create policy "Clients items are publicly readable."
  on public.clients_items for select
  using (true);
