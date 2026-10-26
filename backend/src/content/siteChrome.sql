create table if not exists public.site_chrome_content (
  section text primary key check (section in ('header', 'sidebar', 'footer')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.site_chrome_content enable row level security;
grant select, insert, update, delete on public.site_chrome_content to service_role;
notify pgrst, 'reload schema';
