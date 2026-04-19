ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS sessions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS audience_age_min integer,
  ADD COLUMN IF NOT EXISTS audience_age_max integer,
  ADD COLUMN IF NOT EXISTS requirements text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS participant_benefits text[] NOT NULL DEFAULT '{}'::text[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_event_type_check'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_event_type_check CHECK (
        event_type = ANY (
          ARRAY[
            'training_workshop'::text,
            'webinar'::text,
            'training_course'::text,
            'bootcamp'::text,
            'panel_discussion'::text,
            'camp'::text,
            'forum'::text,
            'conference'::text,
            'flashmob'::text,
            'meetup'::text
          ]
        )
      );
  END IF;
END;
$$;

ALTER TABLE public.events
  ALTER COLUMN application_link SET NOT NULL;

ALTER TABLE public.events
  ADD CONSTRAINT events_audience_age_min_check CHECK (
    audience_age_min IS NULL OR (audience_age_min >= 0 AND audience_age_min <= 99)
  ),
  ADD CONSTRAINT events_audience_age_max_check CHECK (
    audience_age_max IS NULL OR (audience_age_max >= 0 AND audience_age_max <= 99)
  ),
  ADD CONSTRAINT events_audience_age_range_check CHECK (
    audience_age_min IS NULL OR audience_age_max IS NULL OR audience_age_min <= audience_age_max
  );
