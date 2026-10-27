create table if not exists public.site_chrome_content (
  section text primary key check (section in ('header', 'sidebar', 'footer', 'cookie')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.site_chrome_content drop constraint if exists site_chrome_content_section_check;
alter table public.site_chrome_content add constraint site_chrome_content_section_check check (section in ('header', 'sidebar', 'footer', 'cookie'));
alter table public.site_chrome_content enable row level security;
grant select, insert, update, delete on public.site_chrome_content to service_role;
notify pgrst, 'reload schema';
