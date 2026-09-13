-- Belt/rank on athletes + promotions log
-- IDEMPOTENT: safe to run multiple times

-- Define belt/rank enum type
DO $$ BEGIN
  CREATE TYPE public.judo_belt AS ENUM (
    'unset',
    'white',
    'yellow',
    'orange',
    'green',
    'blue',
    'brown',
    'shodan',
    'nidan',
    'sandan',
    'yondan',
    'godan',
    'rokudan',
    'shichidan',
    'hachidan',
    'kudan',
    'judan'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add current_belt column to athletes table (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='athletes' 
                 AND column_name='current_belt') THEN
    ALTER TABLE public.athletes ADD COLUMN current_belt public.judo_belt DEFAULT 'unset';
  END IF;
END $$;

-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  promotion_date date NOT NULL,
  from_belt public.judo_belt NOT NULL,
  to_belt public.judo_belt NOT NULL,
  notes text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast athlete lookups
CREATE INDEX IF NOT EXISTS promotions_athlete_id_idx ON public.promotions(athlete_id);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS promotions_promotion_date_idx ON public.promotions(promotion_date DESC);

-- RLS for promotions table
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Allowlisted coaches can view promotions
DROP POLICY IF EXISTS "Allowlisted coaches can view promotions" ON public.promotions;
CREATE POLICY "Allowlisted coaches can view promotions"
  ON public.promotions FOR SELECT
  USING (public.is_allowlisted_coach());

-- Allowlisted coaches can create promotions
DROP POLICY IF EXISTS "Allowlisted coaches can create promotions" ON public.promotions;
CREATE POLICY "Allowlisted coaches can create promotions"
  ON public.promotions FOR INSERT
  WITH CHECK (public.is_allowlisted_coach());

-- Allowlisted coaches can update promotions
DROP POLICY IF EXISTS "Allowlisted coaches can update promotions" ON public.promotions;
CREATE POLICY "Allowlisted coaches can update promotions"
  ON public.promotions FOR UPDATE
  USING (public.is_allowlisted_coach())
  WITH CHECK (public.is_allowlisted_coach());

-- Allowlisted coaches can delete promotions
DROP POLICY IF EXISTS "Allowlisted coaches can delete promotions" ON public.promotions;
CREATE POLICY "Allowlisted coaches can delete promotions"
  ON public.promotions FOR DELETE
  USING (public.is_allowlisted_coach());

-- Comments for documentation
COMMENT ON COLUMN public.athletes.current_belt IS 'Current judo belt/rank of the athlete';
COMMENT ON TABLE public.promotions IS 'Chronological log of belt promotions for athletes';
COMMENT ON COLUMN public.promotions.athlete_id IS 'Reference to the athlete receiving the promotion';
COMMENT ON COLUMN public.promotions.promotion_date IS 'Date of the promotion';
COMMENT ON COLUMN public.promotions.from_belt IS 'Belt rank before promotion';
COMMENT ON COLUMN public.promotions.to_belt IS 'Belt rank after promotion';
COMMENT ON COLUMN public.promotions.notes IS 'Optional notes about the promotion (e.g., testing location, achievements)';
