create table if not exists public.site_chrome_content (
  section text primary key check (section in ('header', 'sidebar', 'footer', 'cookie', 'forms')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.site_chrome_content drop constraint if exists site_chrome_content_section_check;
alter table public.site_chrome_content add constraint site_chrome_content_section_check check (section in ('header', 'sidebar', 'footer', 'cookie', 'forms'));
update public.site_chrome_content
set content = jsonb_set(content, '{links}', (
  select jsonb_agg(case
    when link->>'href' = '/privacy' and link->>'label' = 'Политика конфиденциальности'
    then jsonb_set(link, '{label}', to_jsonb('Политика в отношении обработки персональных данных пользователей сайта'::text))
    else link end order by position)
  from jsonb_array_elements(content->'links') with ordinality as links(link, position)
)), updated_at = now()
where section = 'footer' and exists (
  select 1 from jsonb_array_elements(content->'links') as link
  where link->>'href' = '/privacy' and link->>'label' = 'Политика конфиденциальности'
);
alter table public.site_chrome_content enable row level security;
grant select, insert, update, delete on public.site_chrome_content to service_role;
notify pgrst, 'reload schema';
