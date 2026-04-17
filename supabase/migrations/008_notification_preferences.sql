-- Notification Preferences Table
-- Allows users and organizations to control which notifications they receive

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  
  -- Modern simplified notification preferences
  -- ESSENTIAL (always on - account security & content moderation)
  -- No toggle needed - these are mandatory notifications
  
  -- ENGAGEMENT (user-toggleable)
  engagement_enabled boolean default true,
  
  -- FREQUENCY (master setting)
  -- 'instant' = send notifications immediately (default)
  -- 'off' = disable all notifications (except essential)
  frequency varchar(20) default 'instant' check (frequency in ('instant', 'off')),
  
  -- Constraints: exactly one of user_id or organization_id must be set
  constraint user_or_org_id_check check (
    (user_id is not null and organization_id is null) or
    (user_id is null and organization_id is not null)
  ),
  
  -- Ensure one preference record per user/org
  unique(user_id),
  unique(organization_id),
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for faster lookups
create index if not exists idx_notification_preferences_user_id on public.notification_preferences(user_id);
create index if not exists idx_notification_preferences_org_id on public.notification_preferences(organization_id);

-- Create initial preferences for existing users/organizations
-- This ensures backward compatibility
insert into public.notification_preferences (user_id)
select id from public.users
where id not in (select user_id from public.notification_preferences where user_id is not null)
on conflict do nothing;

insert into public.notification_preferences (organization_id)
select id from public.organizations
where id not in (select organization_id from public.notification_preferences where organization_id is not null)
on conflict do nothing;

-- Automatically create preferences for new accounts
create or replace function public.create_default_notification_preferences()
returns trigger as $$
begin
  if new.account_type = 'user' then
    insert into public.notification_preferences (user_id)
    values (new.id)
    on conflict do nothing;
  elsif new.account_type = 'organization' then
    insert into public.notification_preferences (organization_id)
    values (new.id)
    on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_create_notification_preferences on public.accounts;
create trigger trigger_create_notification_preferences
after insert on public.accounts
for each row
execute function public.create_default_notification_preferences();
