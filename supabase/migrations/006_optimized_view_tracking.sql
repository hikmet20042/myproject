-- 006_optimized_view_tracking.sql

-- --- BLOGS ---

/**
 * Records a blog view and returns current stats efficiently.
 * Deduplication (view_incremented) is based on a 24h window.
 */
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
BEGIN
  -- Check if this user/session viewed in last 24h
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

  -- Record the view (always insert for audit)
  INSERT INTO blog_views (blog_id, session_id, user_id)
  VALUES (p_blog_id, p_session_id, p_user_id);

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

/**
 * Gets blog stats efficiently (views + unique + reactions).
 */
CREATE OR REPLACE FUNCTION get_blog_stats_v2(
  p_blog_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_views BIGINT;
  v_unique_views BIGINT;
  v_likes BIGINT;
  v_dislikes BIGINT;
  v_user_reaction TEXT;
BEGIN
  -- Views
  SELECT 
    COUNT(*),
    COUNT(DISTINCT COALESCE(user_id::TEXT, session_id))
  INTO v_views, v_unique_views
  FROM blog_views
  WHERE blog_id = p_blog_id;

  -- Reactions
  SELECT COUNT(*) INTO v_likes FROM blog_reactions WHERE blog_id = p_blog_id AND reaction_type = 'like';
  SELECT COUNT(*) INTO v_dislikes FROM blog_reactions WHERE blog_id = p_blog_id AND reaction_type = 'dislike';

  -- User reaction
  IF p_user_id IS NOT NULL THEN
    SELECT reaction_type INTO v_user_reaction FROM blog_reactions WHERE blog_id = p_blog_id AND user_id = p_user_id;
  END IF;

  RETURN json_build_object(
    'views', v_views,
    'unique_views', v_unique_views,
    'likes', v_likes,
    'dislikes', v_dislikes,
    'user_reaction', v_user_reaction,
    'engagement_score', GREATEST(0, v_views + v_likes * 3 - v_dislikes)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- EVENTS & VACANCIES ---

/**
 * Records a content (event/vacancy) view and returns current stats.
 */
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
BEGIN
  -- Check if viewed in last 24h
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

  -- Record the view
  INSERT INTO content_views (content_type, content_id, session_id, user_id)
  VALUES (p_content_type, p_content_id, p_session_id, p_user_id);

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

/**
 * Gets content stats efficiently.
 */
CREATE OR REPLACE FUNCTION get_content_stats_v2(
  p_content_type TEXT,
  p_content_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_views BIGINT;
  v_unique_views BIGINT;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(DISTINCT COALESCE(user_id::TEXT, session_id))
  INTO v_views, v_unique_views
  FROM content_views
  WHERE content_type = p_content_type AND content_id = p_content_id;

  RETURN json_build_object(
    'views', v_views,
    'unique_views', v_unique_views
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- VIEWS FOR EFFICIENT LIST FETCHING ---

CREATE OR REPLACE VIEW public.blogs_with_stats AS
SELECT 
  b.*,
  (SELECT COUNT(*) FROM blog_views bv WHERE bv.blog_id = b.id)::BIGINT as real_views,
  (SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, session_id)) FROM blog_views bv WHERE bv.blog_id = b.id)::BIGINT as real_unique_views,
  (SELECT COUNT(*) FROM blog_reactions br WHERE br.blog_id = b.id AND reaction_type = 'like')::BIGINT as real_likes,
  (SELECT COUNT(*) FROM blog_reactions br WHERE br.blog_id = b.id AND reaction_type = 'dislike')::BIGINT as real_dislikes
FROM blogs b;

CREATE OR REPLACE VIEW public.events_with_stats AS
SELECT 
  e.*,
  (SELECT COUNT(*) FROM content_views cv WHERE cv.content_type = 'event' AND cv.content_id = e.id)::BIGINT as real_views,
  (SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, session_id)) FROM content_views cv WHERE cv.content_type = 'event' AND cv.content_id = e.id)::BIGINT as real_unique_views
FROM events e;

CREATE OR REPLACE VIEW public.vacancies_with_stats AS
SELECT 
  v.*,
  (SELECT COUNT(*) FROM content_views cv WHERE cv.content_type = 'vacancy' AND cv.content_id = v.id)::BIGINT as real_views,
  (SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, session_id)) FROM content_views cv WHERE cv.content_type = 'vacancy' AND cv.content_id = v.id)::BIGINT as real_unique_views
FROM vacancies v;
