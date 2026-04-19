DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_audience_age_min_check'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_audience_age_min_check CHECK (
        audience_age_min IS NULL OR (audience_age_min >= 0 AND audience_age_min <= 99)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_audience_age_max_check'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_audience_age_max_check CHECK (
        audience_age_max IS NULL OR (audience_age_max >= 0 AND audience_age_max <= 99)
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
