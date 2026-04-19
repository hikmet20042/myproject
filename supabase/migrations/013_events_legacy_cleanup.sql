-- Clean up legacy event fields and enforce active event model constraints.

-- PostgreSQL does not allow removing columns via CREATE OR REPLACE VIEW.
-- Drop dependent view first, then recreate it after column cleanup.
DROP VIEW IF EXISTS public.events_with_stats;

ALTER TABLE public.events
  DROP COLUMN IF EXISTS duration,
  DROP COLUMN IF EXISTS schedule,
  DROP COLUMN IF EXISTS prerequisites,
  DROP COLUMN IF EXISTS learning_outcomes,
  DROP COLUMN IF EXISTS cost,
  DROP COLUMN IF EXISTS target_audience,
  DROP COLUMN IF EXISTS syllabus,
  DROP COLUMN IF EXISTS current_participants;

-- Keep active array fields normalized.
UPDATE public.events
SET requirements = '{}'::text[]
WHERE requirements IS NULL;

UPDATE public.events
SET participant_benefits = '{}'::text[]
WHERE participant_benefits IS NULL;

ALTER TABLE public.events
  ALTER COLUMN requirements SET DEFAULT '{}'::text[],
  ALTER COLUMN requirements SET NOT NULL,
  ALTER COLUMN participant_benefits SET DEFAULT '{}'::text[],
  ALTER COLUMN participant_benefits SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_sessions_is_array_check'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_sessions_is_array_check CHECK (
        jsonb_typeof(sessions) = 'array'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_audience_age_range_check'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_audience_age_range_check CHECK (
        audience_age_min IS NULL OR audience_age_max IS NULL OR audience_age_min <= audience_age_max
      );
  END IF;
END;
$$;

CREATE OR REPLACE VIEW public.events_with_stats AS
SELECT
  e.*,
  (
    SELECT COUNT(*)
    FROM content_views cv
    WHERE cv.content_type = 'event' AND cv.content_id = e.id
  )::BIGINT AS real_views,
  (
    SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, session_id))
    FROM content_views cv
    WHERE cv.content_type = 'event' AND cv.content_id = e.id
  )::BIGINT AS real_unique_views,
  (
    SELECT COUNT(*)
    FROM content_saves cs
    WHERE cs.content_type = 'event' AND cs.content_id = e.id
  )::BIGINT AS real_saves
FROM public.events e;
