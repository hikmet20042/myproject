-- =====================================================
-- DATABASE CLEANUP & OPTIMIZATION MIGRATION
-- =====================================================
-- Based on actual Supabase schema (copied from dashboard)
-- This script:
-- 1. Fixes critical bugs (account_type NOT NULL issue)
-- 2. Adds missing RLS policies
-- 3. Fixes foreign key references to deprecated tables
-- 4. Adds missing indexes for performance
-- 5. Removes unused tables, columns, and triggers
-- 6. Optimizes schema for current codebase structure
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: CRITICAL FIXES
-- =====================================================

-- Fix 1.1: Allow account_type to be NULL during onboarding
-- Current: account_type text NOT NULL CHECK (account_type = ANY (ARRAY['user'::text, 'organization'::text]))
-- Issue: Code inserts NULL but schema says NOT NULL
ALTER TABLE public.accounts 
  ALTER COLUMN account_type DROP NOT NULL;

-- Fix 1.2: Update check constraint to allow NULL
ALTER TABLE public.accounts 
  DROP CONSTRAINT accounts_account_type_check;

ALTER TABLE public.accounts 
  ADD CONSTRAINT accounts_account_type_check 
  CHECK (account_type IS NULL OR account_type IN ('user', 'organization'));

-- Fix 1.3: Migrate FKs from deprecated organizations table to accounts table
-- events.created_by_organization references organizations(id) → accounts(id)
ALTER TABLE public.events 
  DROP CONSTRAINT IF EXISTS events_created_by_organization_fkey,
  ADD CONSTRAINT events_created_by_organization_fkey 
  FOREIGN KEY (created_by_organization) REFERENCES public.accounts(id);

-- vacancies.created_by_organization references organizations(id) → accounts(id)
ALTER TABLE public.vacancies 
  DROP CONSTRAINT IF EXISTS vacancies_created_by_organization_fkey,
  ADD CONSTRAINT vacancies_created_by_organization_fkey 
  FOREIGN KEY (created_by_organization) REFERENCES public.accounts(id);

-- notifications.organization_id references organizations(id) → accounts(id)
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_organization_id_fkey,
  ADD CONSTRAINT notifications_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES public.accounts(id);

-- =====================================================
-- SECTION 2: ADD MISSING COLUMNS TO image_blobs
-- =====================================================

-- The actual image_blobs table is missing many columns that code expects
-- Must add these BEFORE RLS policies that reference them

ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS original_name text;
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS mimetype text;
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES public.users(id);
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS uploaded_at timestamp with time zone DEFAULT now();
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS alt text;
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0;
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS last_accessed timestamp with time zone DEFAULT now();
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS height integer;
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS is_compressed boolean DEFAULT false;
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS original_size integer;
ALTER TABLE public.image_blobs ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Add index on uploaded_by for cleanup queries
CREATE INDEX IF NOT EXISTS idx_image_blobs_uploaded_by ON public.image_blobs(uploaded_by);

-- =====================================================
-- SECTION 3: ADD MISSING RLS ENABLEMENT & POLICIES
-- =====================================================

-- Fix 2.1: Enable RLS on image_blobs (currently has NO RLS)
ALTER TABLE public.image_blobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all images" ON public.image_blobs;
CREATE POLICY "Users can view all images"
  ON public.image_blobs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own images" ON public.image_blobs;
CREATE POLICY "Users can insert their own images"
  ON public.image_blobs FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can update their own images" ON public.image_blobs;
CREATE POLICY "Users can update their own images"
  ON public.image_blobs FOR UPDATE
  USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can delete their own images" ON public.image_blobs;
CREATE POLICY "Users can delete their own images"
  ON public.image_blobs FOR DELETE
  USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Admins can manage all images" ON public.image_blobs;
CREATE POLICY "Admins can manage all images"
  ON public.image_blobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE accounts.id = auth.uid() AND accounts.is_admin = true
    )
  );

-- Fix 2.2: Enable RLS on blog_views (currently has NO RLS)
ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert blog views" ON public.blog_views;
CREATE POLICY "Anyone can insert blog views"
  ON public.blog_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read blog views" ON public.blog_views;
CREATE POLICY "Anyone can read blog views"
  ON public.blog_views FOR SELECT
  USING (true);

-- Fix 2.3: Enable RLS on blog_reactions (currently has NO RLS)
ALTER TABLE public.blog_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can insert reactions" ON public.blog_reactions;
CREATE POLICY "Authenticated users can insert reactions"
  ON public.blog_reactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can read reactions" ON public.blog_reactions;
CREATE POLICY "Anyone can read reactions"
  ON public.blog_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.blog_reactions;
CREATE POLICY "Users can delete their own reactions"
  ON public.blog_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Fix 2.4: Add RLS policies for site_settings (has RLS but NO policies)
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE accounts.id = auth.uid() AND accounts.is_admin = true
    )
  );

-- =====================================================
-- SECTION 3: ADD MISSING INDEXES FOR PERFORMANCE
-- =====================================================

-- User authentication & lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Blog queries
CREATE INDEX IF NOT EXISTS idx_blogs_author_id ON public.blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON public.blogs(created_at DESC);

-- Event & vacancy queries
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON public.vacancies(status);

-- Notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Organization queries
CREATE INDEX IF NOT EXISTS idx_org_profiles_moderation_status ON public.organization_profiles(moderation_status);

-- Profile & image queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_image_blobs_uploaded_by ON public.image_blobs(uploaded_by);

-- Content saves
CREATE INDEX IF NOT EXISTS idx_content_saves_user_id ON public.content_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_content_saves_content ON public.content_saves(content_type, content_id);

-- =====================================================
-- SECTION 4: DROP UNUSED TABLES
-- =====================================================

-- Drop saved_items (replaced by content_saves)
DROP TABLE IF EXISTS public.saved_items CASCADE;

-- Drop user_analytics (never used in code)
DROP TABLE IF EXISTS public.user_analytics CASCADE;

-- =====================================================
-- SECTION 5: DROP UNUSED COLUMNS
-- =====================================================

-- Drop mongo_id columns (legacy MongoDB migration artifacts)
ALTER TABLE public.users DROP COLUMN IF EXISTS mongo_id;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS mongo_id;
ALTER TABLE public.organization_profiles DROP COLUMN IF EXISTS mongo_id;
ALTER TABLE public.image_blobs DROP COLUMN IF EXISTS mongo_id;
ALTER TABLE public.blogs DROP COLUMN IF EXISTS mongo_id;
ALTER TABLE public.events DROP COLUMN IF EXISTS mongo_id;
ALTER TABLE public.vacancies DROP COLUMN IF EXISTS mongo_id;
ALTER TABLE public.materials DROP COLUMN IF EXISTS mongo_id;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS mongo_id;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS mongo_id;

-- Drop unused array columns on users (replaced by content_saves)
ALTER TABLE public.users DROP COLUMN IF EXISTS saved_events;
ALTER TABLE public.users DROP COLUMN IF EXISTS saved_vacancies;

-- Drop unused password reset columns (Supabase Auth handles these)
ALTER TABLE public.users DROP COLUMN IF EXISTS password_reset_token;
ALTER TABLE public.users DROP COLUMN IF EXISTS password_reset_expires;
ALTER TABLE public.users DROP COLUMN IF EXISTS verification_email_last_sent;

-- Drop unused columns on organization_profiles
ALTER TABLE public.organization_profiles DROP COLUMN IF EXISTS password_reset_token;
ALTER TABLE public.organization_profiles DROP COLUMN IF EXISTS password_reset_expires;
ALTER TABLE public.organization_profiles DROP COLUMN IF EXISTS verification_email_last_sent;

-- Drop duplicate social_media column (social_links is used instead)
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS social_media;

-- Drop deprecated organizations table password reset columns
ALTER TABLE public.organizations DROP COLUMN IF EXISTS password_reset_token;
ALTER TABLE public.organizations DROP COLUMN IF EXISTS password_reset_expires;
ALTER TABLE public.organizations DROP COLUMN IF EXISTS verification_email_last_sent;

-- =====================================================
-- SECTION 6: ADD UPDATED_AT TRIGGERS TO MISSING TABLES
-- =====================================================

-- Create generic updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables that have updated_at column
-- Drop existing triggers first to avoid duplicates
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_blogs_updated_at ON public.blogs;
CREATE TRIGGER set_blogs_updated_at BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_vacancies_updated_at ON public.vacancies;
CREATE TRIGGER set_vacancies_updated_at BEFORE UPDATE ON public.vacancies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_materials_updated_at ON public.materials;
CREATE TRIGGER set_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_notifications_updated_at ON public.notifications;
CREATE TRIGGER set_notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_image_blobs_updated_at ON public.image_blobs;
CREATE TRIGGER set_image_blobs_updated_at BEFORE UPDATE ON public.image_blobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- accounts and organization_profiles already have updated_at triggers from original schema

-- =====================================================
-- SECTION 7: ADD UNIQUE CONSTRAINT TO content_saves
-- =====================================================

-- Prevent duplicate saves (user can't save same content twice)
ALTER TABLE public.content_saves 
  ADD CONSTRAINT content_saves_unique UNIQUE (user_id, content_type, content_id);

-- =====================================================
-- SECTION 8: VERIFY CHANGES
-- =====================================================

-- Show current account_type constraint (should allow NULL)
SELECT 
  tc.constraint_name, 
  tc.check_clause 
FROM information_schema.check_constraints tc
JOIN information_schema.table_constraints t 
  ON tc.constraint_name = t.constraint_name
WHERE t.table_name = 'accounts' 
  AND t.constraint_type = 'CHECK'
  AND tc.constraint_name LIKE '%account_type%';

-- Count remaining tables (should be 16)
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Show tables with RLS enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verify unused tables are dropped (should return 0 rows)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('saved_items', 'user_analytics');

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- After running this migration:
-- 1. All organization accounts will be properly recognized
-- 2. Database performance will be improved with new indexes
-- 3. Security is enhanced with proper RLS policies
-- 4. Schema is cleaned up and matches current codebase
-- 5. Unused tables/columns are removed
-- 6. image_blobs table has all required columns
-- 7. All tables have updated_at triggers
-- =====================================================
