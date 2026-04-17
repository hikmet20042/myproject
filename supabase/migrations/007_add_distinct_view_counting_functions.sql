-- 007_add_distinct_view_counting_functions.sql

/**
 * Count distinct blog views for a list of blog IDs.
 * Uses COALESCE(user_id::TEXT, session_id) to identify unique viewers.
 */
CREATE OR REPLACE FUNCTION count_distinct_blog_views(p_blog_ids UUID[])
RETURNS BIGINT AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, session_id))
  INTO v_count
  FROM blog_views
  WHERE blog_id = ANY(p_blog_ids);
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Count distinct content views for a specific content type and list of IDs.
 * Uses COALESCE(user_id::TEXT, session_id) to identify unique viewers.
 */
CREATE OR REPLACE FUNCTION count_distinct_content_views(p_content_type TEXT, p_content_ids UUID[])
RETURNS BIGINT AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, session_id))
  INTO v_count
  FROM content_views
  WHERE content_type = p_content_type AND content_id = ANY(p_content_ids);
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
