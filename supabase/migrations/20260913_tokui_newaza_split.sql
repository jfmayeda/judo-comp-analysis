-- Split technique_ids into tokui_technique_ids (Tachi-waza) and newaza_technique_ids (Ne-waza)
-- IDEMPOTENT: safe to run multiple times

-- Add new split columns to athletes table (idempotent with IF NOT EXISTS)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='athletes' 
                 AND column_name='tokui_technique_ids') THEN
    ALTER TABLE public.athletes ADD COLUMN tokui_technique_ids uuid[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='athletes' 
                 AND column_name='newaza_technique_ids') THEN
    ALTER TABLE public.athletes ADD COLUMN newaza_technique_ids uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Add new split columns to opponent_notes table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='opponent_notes' 
                 AND column_name='tokui_technique_ids') THEN
    ALTER TABLE public.opponent_notes ADD COLUMN tokui_technique_ids uuid[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='opponent_notes' 
                 AND column_name='newaza_technique_ids') THEN
    ALTER TABLE public.opponent_notes ADD COLUMN newaza_technique_ids uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Add new split columns to opponents table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='opponents' 
                 AND column_name='tokui_technique_ids') THEN
    ALTER TABLE public.opponents ADD COLUMN tokui_technique_ids uuid[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='opponents' 
                 AND column_name='newaza_technique_ids') THEN
    ALTER TABLE public.opponents ADD COLUMN newaza_technique_ids uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Migrate existing technique_ids to appropriate arrays (only if not already migrated)
-- For athletes
UPDATE public.athletes
SET 
  tokui_technique_ids = COALESCE((
    SELECT array_agg(t.id)
    FROM unnest(technique_ids) AS tid
    JOIN public.techniques t ON t.id = tid
    WHERE t.category = 'Tachi-waza'
  ), '{}'),
  newaza_technique_ids = COALESCE((
    SELECT array_agg(t.id)
    FROM unnest(technique_ids) AS tid
    JOIN public.techniques t ON t.id = tid
    WHERE t.category = 'Ne-waza'
  ), '{}')
WHERE technique_ids IS NOT NULL 
  AND array_length(technique_ids, 1) > 0
  AND (tokui_technique_ids = '{}' OR tokui_technique_ids IS NULL)
  AND (newaza_technique_ids = '{}' OR newaza_technique_ids IS NULL);

-- For opponent_notes
UPDATE public.opponent_notes
SET 
  tokui_technique_ids = COALESCE((
    SELECT array_agg(t.id)
    FROM unnest(technique_ids) AS tid
    JOIN public.techniques t ON t.id = tid
    WHERE t.category = 'Tachi-waza'
  ), '{}'),
  newaza_technique_ids = COALESCE((
    SELECT array_agg(t.id)
    FROM unnest(technique_ids) AS tid
    JOIN public.techniques t ON t.id = tid
    WHERE t.category = 'Ne-waza'
  ), '{}')
WHERE technique_ids IS NOT NULL 
  AND array_length(technique_ids, 1) > 0
  AND (tokui_technique_ids = '{}' OR tokui_technique_ids IS NULL)
  AND (newaza_technique_ids = '{}' OR newaza_technique_ids IS NULL);

-- For opponents
UPDATE public.opponents
SET 
  tokui_technique_ids = COALESCE((
    SELECT array_agg(t.id)
    FROM unnest(technique_ids) AS tid
    JOIN public.techniques t ON t.id = tid
    WHERE t.category = 'Tachi-waza'
  ), '{}'),
  newaza_technique_ids = COALESCE((
    SELECT array_agg(t.id)
    FROM unnest(technique_ids) AS tid
    JOIN public.techniques t ON t.id = tid
    WHERE t.category = 'Ne-waza'
  ), '{}')
WHERE technique_ids IS NOT NULL 
  AND array_length(technique_ids, 1) > 0
  AND (tokui_technique_ids = '{}' OR tokui_technique_ids IS NULL)
  AND (newaza_technique_ids = '{}' OR newaza_technique_ids IS NULL);

-- Comments for documentation
COMMENT ON COLUMN public.athletes.tokui_technique_ids IS 'Array of Tachi-waza technique UUIDs for tokui-waza (standing techniques)';
COMMENT ON COLUMN public.athletes.newaza_technique_ids IS 'Array of Ne-waza technique UUIDs (ground techniques)';
COMMENT ON COLUMN public.opponent_notes.tokui_technique_ids IS 'Array of Tachi-waza technique UUIDs for opponent notes';
COMMENT ON COLUMN public.opponent_notes.newaza_technique_ids IS 'Array of Ne-waza technique UUIDs for opponent notes';
COMMENT ON COLUMN public.opponents.tokui_technique_ids IS 'Array of Tachi-waza technique UUIDs for opponent tokui-waza';
COMMENT ON COLUMN public.opponents.newaza_technique_ids IS 'Array of Ne-waza technique UUIDs for opponent ne-waza';
