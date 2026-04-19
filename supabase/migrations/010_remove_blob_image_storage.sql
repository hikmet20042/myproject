-- Remove deprecated blob-image storage schema after migration to:
-- 1) Supabase Storage for profile images
-- 2) Cloudinary for content images

-- `blogs_with_stats` uses `b.*`, so it depends on all blog columns,
-- including `featured_image_blob_id`.
drop view if exists public.blogs_with_stats;

-- Remove references first
alter table if exists public.user_profiles
  drop column if exists avatar_blob_id;

alter table if exists public.blogs
  drop column if exists featured_image_blob_id;

-- Drop legacy blob table
drop table if exists public.image_blobs;

-- Recreate dropped view without relying on legacy blob columns.
create view public.blogs_with_stats as
select
  b.*,
  (select count(*) from blog_views bv where bv.blog_id = b.id)::bigint as real_views,
  (select count(distinct coalesce(user_id::text, session_id)) from blog_views bv where bv.blog_id = b.id)::bigint as real_unique_views,
  (select count(*) from blog_reactions br where br.blog_id = b.id and reaction_type = 'like')::bigint as real_likes,
  (select count(*) from blog_reactions br where br.blog_id = b.id and reaction_type = 'dislike')::bigint as real_dislikes,
  (select count(*) from content_saves cs where cs.content_type = 'blog' and cs.content_id = b.id)::bigint as real_saves
from blogs b;
