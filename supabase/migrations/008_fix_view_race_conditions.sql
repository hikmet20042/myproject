-- Migration: Fix view tracking race conditions
-- This makes view recording atomic to prevent duplicate views from concurrent requests

-- Fix blog view recording - use advisory lock for atomicity
CREATE OR REPLACE FUNCTION record_blog_view(
  p_blog_id UUID,
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_view_incremented BOOLEAN;
  v_24h_ago TIMESTAMPTZ := NOW() - INTERVAL '24 hours';
  v_total_views BIGINT;
  v_unique_views BIGINT;
  v_lock_key BIGINT;
BEGIN
  -- Use advisory lock based on blog_id to prevent concurrent inserts for same blog
  -- This serializes concurrent view requests per blog
  v_lock_key := hashint8(p_blog_id);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Check if this user/session viewed in last 24h (within the lock)
  IF p_user_id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM blog_views 
      WHERE blog_id = p_blog_id 
      AND user_id = p_user_id 
      AND created_at >= v_24h_ago
    ) INTO v_view_incremented;
  ELSE
    SELECT NOT EXISTS (
      SELECT 1 FROM blog_views 
      WHERE blog_id = p_blog_id 
      AND session_id = p_session_id 
      AND created_at >= v_24h_ago
    ) INTO v_view_incremented;
  END IF;

  -- Only insert if not a duplicate view in 24h window
  IF v_view_incremented THEN
    INSERT INTO blog_views (blog_id, session_id, user_id, created_at)
    VALUES (p_blog_id, p_session_id, p_user_id, NOW());
  END IF;

  -- Get counts
  SELECT 
    COUNT(*),
    COUNT(DISTINCT COALESCE(user_id::TEXT, session_id))
  INTO v_total_views, v_unique_views
  FROM blog_views
  WHERE blog_id = p_blog_id;

  RETURN json_build_object(
    'views', v_total_views,
    'unique_views', v_unique_views,
    'view_incremented', v_view_incremented
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix content view recording (events/vacancies) - use advisory lock for atomicity
CREATE OR REPLACE FUNCTION record_content_view(
  p_content_type TEXT,
  p_content_id UUID,
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_view_incremented BOOLEAN;
  v_24h_ago TIMESTAMPTZ := NOW() - INTERVAL '24 hours';
  v_total_views BIGINT;
  v_unique_views BIGINT;
  v_lock_key BIGINT;
BEGIN
  -- Use advisory lock based on content_id to prevent concurrent inserts for same content
  v_lock_key := hashint8(p_content_id);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Check if viewed in last 24h (within the lock)
  IF p_user_id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM content_views 
      WHERE content_type = p_content_type 
      AND content_id = p_content_id 
      AND user_id = p_user_id 
      AND created_at >= v_24h_ago
    ) INTO v_view_incremented;
  ELSE
    SELECT NOT EXISTS (
      SELECT 1 FROM content_views 
      WHERE content_type = p_content_type 
      AND content_id = p_content_id 
      AND session_id = p_session_id 
      AND created_at >= v_24h_ago
    ) INTO v_view_incremented;
  END IF;

  -- Only insert if not a duplicate view in 24h window
  IF v_view_incremented THEN
    INSERT INTO content_views (content_type, content_id, session_id, user_id, created_at)
    VALUES (p_content_type, p_content_id, p_session_id, p_user_id, NOW());
  END IF;

  -- Get counts
  SELECT 
    COUNT(*),
    COUNT(DISTINCT COALESCE(user_id::TEXT, session_id))
  INTO v_total_views, v_unique_views
  FROM content_views
  WHERE content_type = p_content_type AND content_id = p_content_id;

  RETURN json_build_object(
    'views', v_total_views,
    'unique_views', v_unique_views,
    'view_incremented', v_view_incremented
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;