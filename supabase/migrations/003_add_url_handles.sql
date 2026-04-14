-- Custom URL handles for public profiles
-- /u/{handle} for users, /o/{handle} for organizations
-- Auto-generated from names, customizable in settings

-- 1. Add columns
alter table public.accounts add column if not exists url_handle text;
alter table public.organization_profiles add column if not exists url_handle text;

-- 2. Unique indexes (NULL-safe: multiple NULLs allowed)
create unique index if not exists idx_accounts_url_handle on public.accounts(url_handle) where url_handle is not null;
create unique index if not exists idx_organization_profiles_url_handle on public.organization_profiles(url_handle) where url_handle is not null;

-- 3. Reserved handles
create or replace function public.is_reserved_handle(handle text)
returns boolean
language sql
immutable
as $$
  select lower(handle) in (
    'admin', 'about', 'api', 'auth', 'blogs', 'dashboard', 'edit',
    'notifications', 'onboarding', 'organization', 'organizations',
    'profile', 'resources', 'saved', 'submit', 'users', 'u', 'o',
    'settings', 'login', 'logout', 'register', 'signup', 'signin',
    'search', 'help', 'contact', 'terms', 'privacy', 'feed', 'rss',
    'sitemap', 'robots.txt', 'favicon.ico', '_next', 'static',
    'events', 'vacancies', 'materials', 'home', 'page', 'pages',
    'app', 'apps', 'new', 'create', 'public', 'private', 'test',
    'demo', 'example', 'welcome', 'pricing', 'plans', 'docs',
    'documentation', 'blog', 'status', 'health', 'ping', 'upload',
    'download', 'files', 'images', 'media', 'assets', 'cdn', 'fonts', 'icons'
  )
$$;

-- 4. Helper to generate a handle from a name with collision avoidance
create or replace function public.generate_unique_handle(base_name text, table_name text)
returns text
language plpgsql
as $$
declare
  base text;
  candidate text;
  suffix int := 0;
  exists bool;
begin
  -- Normalize: lowercase, transliterate Azerbaijani chars, replace non-alphanumeric with hyphens
  base := lower(base_name);
  base := regexp_replace(base, '[ə]', 'e', 'g');
  base := regexp_replace(base, '[ı]', 'i', 'g');
  base := regexp_replace(base, '[ö]', 'o', 'g');
  base := regexp_replace(base, '[ü]', 'u', 'g');
  base := regexp_replace(base, '[ç]', 'c', 'g');
  base := regexp_replace(base, '[ş]', 's', 'g');
  base := regexp_replace(base, '[ğ]', 'g', 'g');
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '-+', '-', 'g');
  base := regexp_replace(base, '^-|-$', '', 'g');

  if length(base) = 0 or base is null then
    base := 'user';
  end if;

  -- Truncate to 40 chars to leave room for suffix
  if length(base) > 40 then
    base := substr(base, 1, 40);
    base := regexp_replace(base, '-$', '', 'g');
  end if;

  candidate := base;

  -- Check reserved
  if public.is_reserved_handle(candidate) then
    candidate := base || '-user';
  end if;

  -- Check uniqueness and append suffix if needed
  loop
    if table_name = 'accounts' then
      select exists(select 1 from public.accounts where url_handle = candidate) into exists;
    else
      select exists(select 1 from public.organization_profiles where url_handle = candidate) into exists;
    end if;

    if not exists then
      return candidate;
    end if;

    suffix := suffix + 1;
    candidate := base || '-' || suffix::text;
  end loop;
end;
$$;

-- 5. Validation trigger
create or replace function public.validate_url_handle()
returns trigger
language plpgsql
as $$
declare
  reserved boolean;
begin
  if NEW.url_handle is not null then
    NEW.url_handle := lower(trim(NEW.url_handle));
    if length(NEW.url_handle) = 0 then
      NEW.url_handle := null;
      return NEW;
    end if;
    select public.is_reserved_handle(NEW.url_handle) into reserved;
    if reserved then
      raise exception 'URL handle "%" is reserved and cannot be used', NEW.url_handle;
    end if;
    if length(NEW.url_handle) < 3 then
      raise exception 'URL handle must be at least 3 characters';
    end if;
    if length(NEW.url_handle) > 50 then
      raise exception 'URL handle must be at most 50 characters';
    end if;
    if length(NEW.url_handle) > 1 and NEW.url_handle !~ '^[a-z0-9][a-z0-9_-]*[a-z0-9]$' then
      raise exception 'URL handle can only contain lowercase letters, numbers, hyphens and underscores, and must start and end with a letter or number';
    end if;
    if length(NEW.url_handle) = 1 and NEW.url_handle !~ '^[a-z0-9]$' then
      raise exception 'URL handle can only contain lowercase letters and numbers';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_accounts_validate_url_handle on public.accounts;
create trigger trg_accounts_validate_url_handle
  before insert or update of url_handle on public.accounts
  for each row
  execute function public.validate_url_handle();

drop trigger if exists trg_organization_profiles_validate_url_handle on public.organization_profiles;
create trigger trg_organization_profiles_validate_url_handle
  before insert or update of url_handle on public.organization_profiles
  for each row
  execute function public.validate_url_handle();

-- 6. Auto-generate handle on account insert if not provided
create or replace function public.auto_set_account_handle()
returns trigger
language plpgsql
as $$
begin
  if NEW.url_handle is null or NEW.url_handle = '' then
    -- Try to derive from user's name via users table
    declare
      user_name text;
    begin
      select name into user_name from public.users where id = NEW.id limit 1;
      if user_name is not null and length(user_name) > 0 then
        NEW.url_handle := public.generate_unique_handle(user_name, 'accounts');
      else
        -- Fallback: use part of the UUID
        NEW.url_handle := 'user-' || substr(NEW.id::text, 1, 8);
      end if;
    end;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_accounts_auto_handle on public.accounts;
create trigger trg_accounts_auto_handle
  before insert on public.accounts
  for each row
  when (NEW.url_handle is null)
  execute function public.auto_set_account_handle();

-- 7. Auto-generate handle on org profile insert if not provided
create or replace function public.auto_set_org_handle()
returns trigger
language plpgsql
as $$
begin
  if NEW.url_handle is null or NEW.url_handle = '' then
    if NEW.organization_name is not null and length(NEW.organization_name) > 0 then
      NEW.url_handle := public.generate_unique_handle(NEW.organization_name, 'organization_profiles');
    else
      NEW.url_handle := 'org-' || substr(NEW.account_id::text, 1, 8);
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_org_profiles_auto_handle on public.organization_profiles;
create trigger trg_org_profiles_auto_handle
  before insert on public.organization_profiles
  for each row
  when (NEW.url_handle is null)
  execute function public.auto_set_org_handle();

-- 8. Backfill existing rows
-- For accounts: use name from users table
update public.accounts a
set url_handle = public.generate_unique_handle(
  coalesce((select name from public.users where id = a.id limit 1), 'user-' || substr(a.id::text, 1, 8)),
  'accounts'
)
where a.url_handle is null
  and a.account_type = 'user';

-- For org profiles: use organization_name
update public.organization_profiles op
set url_handle = public.generate_unique_handle(
  coalesce(op.organization_name, 'org-' || substr(op.account_id::text, 1, 8)),
  'organization_profiles'
)
where op.url_handle is null;

-- 9. Ensure NOT NULL after backfill (optional: comment out if you want handles to be optional)
-- alter table public.accounts alter column url_handle set not null;
-- alter table public.organization_profiles alter column url_handle set not null;
