-- Ensure legacy save table is removed and engagement stat views expose save counts.

DROP TABLE IF EXISTS public.saved_items CASCADE;

CREATE OR REPLACE VIEW public.blogs_with_stats AS
SELECT
  b.*,
  (SELECT COUNT(*) FROM blog_views bv WHERE bv.blog_id = b.id)::BIGINT as real_views,
  (SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, session_id)) FROM blog_views bv WHERE bv.blog_id = b.id)::BIGINT as real_unique_views,
  (SELECT COUNT(*) FROM blog_reactions br WHERE br.blog_id = b.id AND reaction_type = 'like')::BIGINT as real_likes,
  (SELECT COUNT(*) FROM blog_reactions br WHERE br.blog_id = b.id AND reaction_type = 'dislike')::BIGINT as real_dislikes,
  (SELECT COUNT(*) FROM content_saves cs WHERE cs.content_type = 'blog' AND cs.content_id = b.id)::BIGINT as real_saves
FROM blogs b;

CREATE OR REPLACE VIEW public.events_with_stats AS
SELECT
  e.*,
  (SELECT COUNT(*) FROM content_views cv WHERE cv.content_type = 'event' AND cv.content_id = e.id)::BIGINT as real_views,
  (SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, session_id)) FROM content_views cv WHERE cv.content_type = 'event' AND cv.content_id = e.id)::BIGINT as real_unique_views,
  (SELECT COUNT(*) FROM content_saves cs WHERE cs.content_type = 'event' AND cs.content_id = e.id)::BIGINT as real_saves
FROM events e;

CREATE OR REPLACE VIEW public.vacancies_with_stats AS
SELECT
  v.*,
  (SELECT COUNT(*) FROM content_views cv WHERE cv.content_type = 'vacancy' AND cv.content_id = v.id)::BIGINT as real_views,
  (SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, session_id)) FROM content_views cv WHERE cv.content_type = 'vacancy' AND cv.content_id = v.id)::BIGINT as real_unique_views,
  (SELECT COUNT(*) FROM content_saves cs WHERE cs.content_type = 'vacancy' AND cs.content_id = v.id)::BIGINT as real_saves
FROM vacancies v;
