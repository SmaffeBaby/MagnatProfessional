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
