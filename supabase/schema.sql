-- Supabase schema for icma360

create extension if not exists "pgcrypto";

-- ACCOUNTS (unified app identity)
create table if not exists public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('user', 'organization')),
  is_admin boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- USERS (app profile)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  mongo_id text unique,
  name text not null,
  email text not null,
  -- DEPRECATED FOR AUTHORIZATION: Do not use users.role for admin/permission checks.
  -- Canonical admin authority is public.accounts.is_admin.
  role text not null default 'user' check (role in ('user','admin')),
  auth_provider text not null default 'credentials' check (auth_provider in ('credentials','google')),
  verification_email_last_sent timestamptz,
  password_reset_token text,
  password_reset_expires timestamptz,
  saved_events uuid[] default '{}',
  saved_vacancies uuid[] default '{}',
  social_media jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ORGANIZATIONS (app profile)
create table if not exists public.organizations (
  id uuid primary key references auth.users(id) on delete cascade,
  mongo_id text unique,
  organization_name text not null,
  organization_type text not null,
  email text not null,
  profile_image jsonb,
  description text not null,
  website text,
  contact_phone text,
  address text,
  registration_number text,
  focus_areas text[] default '{}',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_at timestamptz,
  approved_by uuid references public.users(id),
  admin_comment text,
  verification_email_last_sent timestamptz,
  password_reset_token text,
  password_reset_expires timestamptz,
  contact_person jsonb not null,
  social_media jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- USER PROFILES
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  mongo_id text unique,
  user_id uuid not null references public.users(id) on delete cascade,
  bio text,
  location text,
  website text,
  phone text,
  date_of_birth date,
  gender text,
  occupation text,
  organization text,
  interests text,
  avatar text,
  avatar_blob_id uuid,
  avatar_metadata jsonb,
  social_links jsonb,
  social_media jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ORGANIZATION PROFILES (one-to-one with accounts)
create table if not exists public.organization_profiles (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  organization_name text,
  organization_type text,
  description text,
  email text,
  profile_image jsonb,
  website text,
  contact_phone text,
  address text,
  registration_number text,
  focus_areas text[] default '{}',
  contact_person jsonb,
  social_links jsonb,
  is_verified boolean not null default false,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  admin_comment text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  verification_email_last_sent timestamptz,
  password_reset_token text,
  password_reset_expires timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_profiles add column if not exists organization_name text;
alter table public.organization_profiles add column if not exists organization_type text;
alter table public.organization_profiles add column if not exists description text;
alter table public.organization_profiles add column if not exists email text;
alter table public.organization_profiles add column if not exists profile_image jsonb;
alter table public.organization_profiles add column if not exists registration_number text;
alter table public.organization_profiles add column if not exists focus_areas text[] default '{}';
alter table public.organization_profiles add column if not exists contact_person jsonb;
alter table public.organization_profiles add column if not exists is_verified boolean not null default false;
alter table public.organization_profiles add column if not exists moderation_status text not null default 'pending';
alter table public.organization_profiles add column if not exists admin_comment text;
alter table public.organization_profiles add column if not exists reviewed_at timestamptz;
alter table public.organization_profiles add column if not exists reviewed_by uuid references public.users(id);
alter table public.organization_profiles add column if not exists verification_email_last_sent timestamptz;
alter table public.organization_profiles add column if not exists password_reset_token text;
alter table public.organization_profiles add column if not exists password_reset_expires timestamptz;

-- IMAGE BLOBS
create table if not exists public.image_blobs (
  id uuid primary key default gen_random_uuid(),
  mongo_id text unique,
  content_type text,
  filename text,
  original_name text,
  mimetype text,
  size integer,
  data bytea,
  uploaded_by uuid references public.users(id),
  uploaded_at timestamptz default now(),
  description text,
  alt text,
  tags text[] default '{}',
  usage_count integer default 0,
  last_accessed timestamptz default now(),
  width integer,
  height integer,
  is_compressed boolean default false,
  original_size integer,
  metadata jsonb,
  created_at timestamptz default now()
);

-- BLOGS
create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  mongo_id text unique,
  title text not null,
  content jsonb not null,
  content_html text,
  author_id uuid references public.users(id),
  author_name text,
  tags text[] default '{}',
  abstract text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_comment text,
  is_anonymous boolean default false,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  media jsonb,
  featured_image text,
  featured_image_blob_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.blogs drop column if exists views;
alter table public.blogs drop column if exists unique_views;
alter table public.blogs drop column if exists viewed_by;
alter table public.blogs drop column if exists likes;
alter table public.blogs drop column if exists liked_by;
alter table public.blogs drop column if exists dislikes;
alter table public.blogs drop column if exists disliked_by;
alter table public.blogs drop column if exists engagement_score;

-- BLOG ENGAGEMENT EVENTS (FOUNDATION)
create table if not exists public.blog_views (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references public.blogs(id) on delete cascade,
  session_id text not null,
  user_id uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_blog_views_blog_created_at
  on public.blog_views(blog_id, created_at desc);
create index if not exists idx_blog_views_session_blog
  on public.blog_views(session_id, blog_id);
create index if not exists idx_blog_views_user_blog
  on public.blog_views(user_id, blog_id);

create table if not exists public.blog_reactions (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references public.blogs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique(user_id, blog_id)
);

create index if not exists idx_blog_reactions_blog_type
  on public.blog_reactions(blog_id, reaction_type);
create index if not exists idx_blog_reactions_user_blog
  on public.blog_reactions(user_id, blog_id);

-- EVENTS
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  mongo_id text unique,
  title text not null,
  description text not null,
  category text not null,
  event_type text not null,
  event_date timestamptz not null,
  end_date timestamptz,
  duration jsonb,
  schedule text,
  prerequisites text[] default '{}',
  learning_outcomes text[] default '{}',
  certification jsonb,
  cost jsonb,
  target_audience text[] default '{}',
  syllabus text,
  location jsonb not null,
  application_link text,
  application_deadline timestamptz,
  max_participants integer,
  current_participants integer default 0,
  tags text[] default '{}',
  image_url text,
  images jsonb,
  created_by uuid references public.users(id),
  created_by_organization uuid references public.organizations(id),
  organization_name text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_at timestamptz,
  approved_by uuid references public.users(id),
  rejected_at timestamptz,
  rejection_reason text,
  admin_comment text,
  is_published boolean default false,
  is_featured boolean default false,
  views integer default 0,
  unique_views integer default 0,
  viewed_by uuid[] default '{}',
  engagement_score integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- VACANCIES
create table if not exists public.vacancies (
  id uuid primary key default gen_random_uuid(),
  mongo_id text unique,
  title text not null,
  description text not null,
  type text not null,
  category text not null,
  work_type text not null,
  location jsonb not null,
  requirements text[] default '{}',
  responsibilities text[] default '{}',
  qualifications text[] default '{}',
  experience_level text not null,
  duration jsonb not null,
  compensation jsonb not null,
  application_process jsonb not null,
  application_deadline timestamptz not null,
  start_date timestamptz,
  skills text[] default '{}',
  languages text[] default '{}',
  tags text[] default '{}',
  image_url text,
  created_by uuid references public.users(id),
  created_by_organization uuid references public.organizations(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_at timestamptz,
  approved_by uuid references public.users(id),
  rejected_at timestamptz,
  rejection_reason text,
  admin_comment text,
  is_published boolean default false,
  is_featured boolean default false,
  is_urgent boolean default false,
  application_count integer default 0,
  views integer default 0,
  unique_views integer default 0,
  viewed_by uuid[] default '{}',
  engagement_score integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MATERIALS
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  mongo_id text unique,
  title text not null,
  description text not null,
  category text not null,
  type text not null,
  url text not null,
  image_url text,
  provider text,
  duration text,
  language text[] default '{"English"}',
  tags text[] default '{}',
  featured boolean default false,
  is_published boolean default true,
  "order" integer default 0,
  views integer default 0,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  mongo_id text unique,
  user_id uuid references public.users(id),
  organization_id uuid references public.organizations(id),
  type text not null,
  title text not null,
  message text not null,
  data jsonb,
  action_url text,
  is_read boolean default false,
  related_item_id text,
  related_item_type text check (related_item_type in ('event', 'vacancy', 'blog')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.organization_followers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization_profiles(account_id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(organization_id, user_id)
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  item_id text not null,
  item_type text not null check (item_type in ('event', 'vacancy', 'blog')),
  created_at timestamptz not null default now(),
  unique(user_id, item_id, item_type)
);

create index if not exists idx_saved_items_user_id on public.saved_items(user_id);
create index if not exists idx_saved_items_type_item on public.saved_items(item_type, item_id);

create table if not exists public.content_saves (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('blog', 'event', 'vacancy')),
  content_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, content_type, content_id)
);

create index if not exists idx_content_saves_content on public.content_saves(content_type, content_id);
create index if not exists idx_content_saves_user on public.content_saves(user_id, created_at desc);



-- SITE SETTINGS
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  mongo_id text unique,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- USER ANALYTICS
create table if not exists public.user_analytics (
  id uuid primary key default gen_random_uuid(),
  mongo_id text unique,
  user_id uuid references public.users(id),
  data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.accounts enable row level security;
alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.organization_profiles enable row level security;
alter table public.blogs enable row level security;
alter table public.events enable row level security;
alter table public.vacancies enable row level security;
alter table public.materials enable row level security;
alter table public.notifications enable row level security;
alter table public.organization_followers enable row level security;
alter table public.saved_items enable row level security;
alter table public.content_saves enable row level security;
alter table public.site_settings enable row level security;
alter table public.user_analytics enable row level security;

-- Policies
drop policy if exists "Users can view own account" on public.accounts;
create policy "Users can view own account" on public.accounts
  for select using (auth.uid() = id);

drop policy if exists "Users can update own account" on public.accounts;
create policy "Users can update own account" on public.accounts
  for update using (auth.uid() = id);

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

drop policy if exists "Organizations can view own profile" on public.organizations;
create policy "Organizations can view own profile" on public.organizations
  for select using (auth.uid() = id);

drop policy if exists "Organizations can update own profile" on public.organizations;
create policy "Organizations can update own profile" on public.organizations
  for update using (auth.uid() = id);

drop policy if exists "Public approved blogs" on public.blogs;
create policy "Public approved blogs" on public.blogs
  for select using (status = 'approved');

drop policy if exists "Owners manage blogs" on public.blogs;
create policy "Owners manage blogs" on public.blogs
  for all using (auth.uid() = author_id);

drop policy if exists "Public approved events" on public.events;
create policy "Public approved events" on public.events
  for select using (status = 'approved');

drop policy if exists "Owners manage events" on public.events;
create policy "Owners manage events" on public.events
  for all using (auth.uid() = created_by or auth.uid() = created_by_organization);

drop policy if exists "Public approved vacancies" on public.vacancies;
create policy "Public approved vacancies" on public.vacancies
  for select using (status = 'approved');

drop policy if exists "Owners manage vacancies" on public.vacancies;
create policy "Owners manage vacancies" on public.vacancies
  for all using (auth.uid() = created_by or auth.uid() = created_by_organization);

drop policy if exists "Public materials" on public.materials;
create policy "Public materials" on public.materials
  for select using (is_published = true);

drop policy if exists "Users manage notifications" on public.notifications;
create policy "Users manage notifications" on public.notifications
  for all using (auth.uid() = user_id or auth.uid() = organization_id);

drop policy if exists "Users manage profiles" on public.user_profiles;
create policy "Users manage profiles" on public.user_profiles
  for all using (auth.uid() = user_id);

drop policy if exists "Organizations manage own organization profile" on public.organization_profiles;
create policy "Organizations manage own organization profile" on public.organization_profiles
  for all using (auth.uid() = account_id);

drop policy if exists "Users can view organization followers" on public.organization_followers;
create policy "Users can view organization followers" on public.organization_followers
  for select using (true);

drop policy if exists "Users can follow organizations" on public.organization_followers;
create policy "Users can follow organizations" on public.organization_followers
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow organizations" on public.organization_followers;
create policy "Users can unfollow organizations" on public.organization_followers
  for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own saved items" on public.saved_items;
create policy "Users can view own saved items" on public.saved_items
  for select using (auth.uid() = user_id);

drop policy if exists "Users can manage own saved items" on public.saved_items;
create policy "Users can manage own saved items" on public.saved_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view own content saves" on public.content_saves;
create policy "Users can view own content saves" on public.content_saves
  for select using (auth.uid() = user_id);

drop policy if exists "Users can manage own content saves" on public.content_saves;
create policy "Users can manage own content saves" on public.content_saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Seed/backfill accounts from existing auth/users/organizations data.
insert into public.accounts (id, account_type, is_admin, is_active)
select
  au.id,
  case when o.id is not null then 'organization' else 'user' end as account_type,
  coalesce(u.role = 'admin', false) as is_admin,
  true as is_active
from auth.users au
left join public.organizations o on o.id = au.id
left join public.users u on u.id = au.id
on conflict (id) do update set
  account_type = excluded.account_type,
  is_admin = excluded.is_admin,
  is_active = excluded.is_active,
  updated_at = now();

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_accounts_updated_at on public.accounts;
create trigger trg_accounts_updated_at
before update on public.accounts
for each row
execute function public.set_updated_at();

create index if not exists idx_events_org_created_at on public.events(created_by_organization, created_at desc);
create index if not exists idx_vacancies_org_created_at on public.vacancies(created_by_organization, created_at desc);

drop trigger if exists trg_organization_profiles_updated_at on public.organization_profiles;
create trigger trg_organization_profiles_updated_at
before update on public.organization_profiles
for each row
execute function public.set_updated_at();

-- Backfill organization_profiles from organizations (idempotent).
insert into public.organization_profiles (
  account_id,
  organization_name,
  organization_type,
  description,
  email,
  profile_image,
  website,
  contact_phone,
  address,
  registration_number,
  focus_areas,
  contact_person,
  social_links,
  moderation_status,
  admin_comment,
  reviewed_at,
  reviewed_by,
  verification_email_last_sent,
  password_reset_token,
  password_reset_expires,
  created_at,
  updated_at
)
select
  o.id as account_id,
  o.organization_name,
  o.organization_type,
  o.description,
  o.email,
  o.profile_image,
  o.website,
  o.contact_phone,
  o.address,
  o.registration_number,
  coalesce(o.focus_areas, '{}') as focus_areas,
  o.contact_person,
  o.social_media as social_links,
  o.status as moderation_status,
  o.admin_comment,
  o.approved_at as reviewed_at,
  o.approved_by as reviewed_by,
  o.verification_email_last_sent,
  o.password_reset_token,
  o.password_reset_expires,
  coalesce(o.created_at, now()) as created_at,
  coalesce(o.updated_at, now()) as updated_at
from public.organizations o
on conflict (account_id) do update set
  organization_name = excluded.organization_name,
  organization_type = excluded.organization_type,
  description = excluded.description,
  email = excluded.email,
  profile_image = excluded.profile_image,
  website = excluded.website,
  contact_phone = excluded.contact_phone,
  address = excluded.address,
  registration_number = excluded.registration_number,
  focus_areas = excluded.focus_areas,
  contact_person = excluded.contact_person,
  social_links = excluded.social_links,
  moderation_status = excluded.moderation_status,
  admin_comment = excluded.admin_comment,
  reviewed_at = excluded.reviewed_at,
  reviewed_by = excluded.reviewed_by,
  verification_email_last_sent = excluded.verification_email_last_sent,
  password_reset_token = excluded.password_reset_token,
  password_reset_expires = excluded.password_reset_expires,
  updated_at = now();

-- Keep accounts aligned for organization identities.
update public.accounts a
set account_type = 'organization',
    updated_at = now()
from public.organizations o
where a.id = o.id
  and a.account_type <> 'organization';

insert into public.organization_profiles (account_id)
select a.id
from public.accounts a
left join public.organization_profiles op on op.account_id = a.id
where a.account_type = 'organization'
  and op.account_id is null
on conflict (account_id) do nothing;

drop trigger if exists trg_sync_organizations_to_profiles on public.organizations;
drop function if exists public.sync_organization_to_profile();

-- organizations table is kept temporarily for rollback safety, but deprecated.
-- Runtime code must not read from or write to public.organizations.

-- Ensure organization account rows always have a profile row.
create or replace function public.ensure_org_profile_from_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_type = 'organization' then
    insert into public.organization_profiles (account_id)
    values (new.id)
    on conflict (account_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_accounts_ensure_org_profile on public.accounts;
create trigger trg_accounts_ensure_org_profile
after insert or update of account_type on public.accounts
for each row
execute function public.ensure_org_profile_from_account();

-- Validation surface for migration consistency checks.
create or replace view public.organization_profile_migration_audit as
select
  (select count(*) from public.accounts a where a.account_type = 'organization') as organization_accounts,
  (select count(*) from public.organization_profiles) as profile_rows,
  (select count(*) from public.accounts a
     left join public.organization_profiles op on op.account_id = a.id
     where a.account_type = 'organization' and op.account_id is null) as missing_profiles,
  (select count(*) from public.organization_profiles op
     left join public.accounts a on a.id = op.account_id
     where a.id is null or a.account_type <> 'organization') as orphan_or_mismatch_profiles;

-- Ensure each auth user has an accounts row.
create or replace function public.ensure_account_row_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.accounts (id, account_type, is_admin, is_active)
  values (new.id, null, false, true)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_accounts on auth.users;
create trigger on_auth_user_created_accounts
after insert on auth.users
for each row
execute function public.ensure_account_row_for_auth_user();
