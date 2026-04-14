-- Add slug columns to content tables for SEO-friendly URLs
-- and populate them from existing data.

-- 1. Add slug columns
alter table public.blogs add column if not exists slug text unique;
alter table public.organization_profiles add column if not exists slug text unique;
alter table public.events add column if not exists slug text unique;
alter table public.vacancies add column if not exists slug text unique;

-- 2. Generate slugs for existing blogs
update public.blogs
set slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9əıöüçşğƏİÖÜÇŞĞ\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
) || '-' || substr(md5(random()::text), 1, 6)
where slug is null;

-- 3. Generate slugs for existing organization profiles
update public.organization_profiles
set slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(organization_name, '[^a-zA-Z0-9əıöüçşğƏİÖÜÇŞĞ\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
) || '-' || substr(md5(random()::text), 1, 6)
where slug is null;

-- 4. Generate slugs for existing events
update public.events
set slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9əıöüçşğƏİÖÜÇŞĞ\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
) || '-' || substr(md5(random()::text), 1, 6)
where slug is null;

-- 5. Generate slugs for existing vacancies
update public.vacancies
set slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9əıöüçşğƏİÖÜÇŞĞ\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
) || '-' || substr(md5(random()::text), 1, 6)
where slug is null;

-- 6. Ensure NOT NULL constraint after population
alter table public.blogs alter column slug set not null;
alter table public.organization_profiles alter column slug set not null;
alter table public.events alter column slug set not null;
alter table public.vacancies alter column slug set not null;

-- 7. Index for fast slug lookups
create index if not exists idx_blogs_slug on public.blogs(slug);
create index if not exists idx_organization_profiles_slug on public.organization_profiles(slug);
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_vacancies_slug on public.vacancies(slug);

-- 8. Trigger function to auto-generate slug on insert for blogs
create or replace function public.generate_blog_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  base_slug := regexp_replace(lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')), '-+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  if length(coalesce(base_slug, '')) = 0 then base_slug := 'blog'; end if;
  final_slug := base_slug || '-' || substr(md5(random()::text || coalesce(NEW.id::text, '')), 1, 6);
  while exists (select 1 from public.blogs where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  NEW.slug := final_slug;
  return NEW;
end;
$$;

create or replace function public.generate_org_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  base_slug := regexp_replace(lower(regexp_replace(regexp_replace(NEW.organization_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')), '-+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  if length(coalesce(base_slug, '')) = 0 then base_slug := 'organization'; end if;
  final_slug := base_slug || '-' || substr(md5(random()::text || coalesce(NEW.account_id::text, '')), 1, 6);
  while exists (select 1 from public.organization_profiles where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  NEW.slug := final_slug;
  return NEW;
end;
$$;

create or replace function public.generate_event_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  base_slug := regexp_replace(lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')), '-+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  if length(coalesce(base_slug, '')) = 0 then base_slug := 'event'; end if;
  final_slug := base_slug || '-' || substr(md5(random()::text || coalesce(NEW.id::text, '')), 1, 6);
  while exists (select 1 from public.events where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  NEW.slug := final_slug;
  return NEW;
end;
$$;

create or replace function public.generate_vacancy_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  base_slug := regexp_replace(lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')), '-+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  if length(coalesce(base_slug, '')) = 0 then base_slug := 'vacancy'; end if;
  final_slug := base_slug || '-' || substr(md5(random()::text || coalesce(NEW.id::text, '')), 1, 6);
  while exists (select 1 from public.vacancies where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  NEW.slug := final_slug;
  return NEW;
end;
$$;

-- Drop existing triggers if they exist
drop trigger if exists trg_blogs_generate_slug on public.blogs;
drop trigger if exists trg_organization_profiles_generate_slug on public.organization_profiles;
drop trigger if exists trg_events_generate_slug on public.events;
drop trigger if exists trg_vacancies_generate_slug on public.vacancies;

-- Create per-table triggers for auto-generation
create trigger trg_blogs_generate_slug
  before insert on public.blogs
  for each row
  when (NEW.slug is null)
  execute function public.generate_blog_slug();

create trigger trg_organization_profiles_generate_slug
  before insert on public.organization_profiles
  for each row
  when (NEW.slug is null)
  execute function public.generate_org_slug();

create trigger trg_events_generate_slug
  before insert on public.events
  for each row
  when (NEW.slug is null)
  execute function public.generate_event_slug();

create trigger trg_vacancies_generate_slug
  before insert on public.vacancies
  for each row
  when (NEW.slug is null)
  execute function public.generate_vacancy_slug();
