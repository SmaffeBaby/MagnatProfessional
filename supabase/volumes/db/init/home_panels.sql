create extension if not exists "pgcrypto";

create table if not exists public.home_panels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
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
