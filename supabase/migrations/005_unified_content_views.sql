-- 005_unified_content_views.sql
-- Unified view tracking for events and vacancies using a separate table
-- (mirroring the blog_views pattern for consistency)

-- 1. Create the content_views table
create table if not exists public.content_views (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('event', 'vacancy')),
  content_id uuid not null,
  session_id text not null,
  user_id uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 2. Indexes for efficient queries
create index if not exists idx_content_views_type_id on public.content_views(content_type, content_id);
create index if not exists idx_content_views_type_id_created on public.content_views(content_type, content_id, created_at desc);
create index if not exists idx_content_views_session on public.content_views(session_id, content_type, content_id);
create index if not exists idx_content_views_user on public.content_views(user_id, content_type, content_id);

-- 3. RLS
alter table public.content_views enable row level security;

drop policy if exists "Anyone can view content views" on public.content_views;
create policy "Anyone can view content views" on public.content_views
  for select using (true);

drop policy if exists "Anyone can insert content views" on public.content_views;
create policy "Anyone can insert content views" on public.content_views
  for insert with check (true);
