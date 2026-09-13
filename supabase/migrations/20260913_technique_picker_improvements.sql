-- Technique Picker Improvements Migration
-- Adds support for custom techniques and splits technique storage by category

-- 1. Add is_custom and created_by columns to techniques table
ALTER TABLE public.techniques 
ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create index for faster custom technique lookups
CREATE INDEX IF NOT EXISTS techniques_is_custom_idx ON public.techniques(is_custom);
CREATE INDEX IF NOT EXISTS techniques_category_idx ON public.techniques(category);

-- 3. Split technique_ids in athletes table into tokui and newaza
-- Add new columns
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS tokui_technique_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS newaza_technique_ids uuid[] DEFAULT '{}';

-- Migrate existing technique_ids data
-- Split by category: Tachi-waza goes to tokui, Ne-waza goes to newaza
UPDATE public.athletes a
SET tokui_technique_ids = ARRAY(
  SELECT t_id 
  FROM unnest(a.technique_ids) AS t_id
  WHERE t_id IN (
    SELECT id FROM public.techniques WHERE category = 'Tachi-waza'
  )
),
newaza_technique_ids = ARRAY(
  SELECT t_id 
  FROM unnest(a.technique_ids) AS t_id
  WHERE t_id IN (
    SELECT id FROM public.techniques WHERE category = 'Ne-waza'
  )
)
WHERE a.technique_ids IS NOT NULL AND array_length(a.technique_ids, 1) > 0;

-- Keep old technique_ids column for backward compatibility (can be dropped later)
-- ALTER TABLE public.athletes DROP COLUMN IF EXISTS technique_ids;

-- 4. Split technique_ids in opponent_notes table
ALTER TABLE public.opponent_notes 
ADD COLUMN IF NOT EXISTS tokui_technique_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS newaza_technique_ids uuid[] DEFAULT '{}';

-- Migrate existing opponent_notes technique_ids data
UPDATE public.opponent_notes o
SET tokui_technique_ids = ARRAY(
  SELECT t_id 
  FROM unnest(o.technique_ids) AS t_id
  WHERE t_id IN (
    SELECT id FROM public.techniques WHERE category = 'Tachi-waza'
  )
),
newaza_technique_ids = ARRAY(
  SELECT t_id 
  FROM unnest(o.technique_ids) AS t_id
  WHERE t_id IN (
    SELECT id FROM public.techniques WHERE category = 'Ne-waza'
  )
)
WHERE o.technique_ids IS NOT NULL AND array_length(o.technique_ids, 1) > 0;

-- 5. RLS policies for techniques table
ALTER TABLE public.techniques ENABLE ROW LEVEL SECURITY;

-- Everyone can view all techniques (both standard and custom)
DROP POLICY IF EXISTS "Allowlisted coaches can view techniques" ON public.techniques;
CREATE POLICY "Allowlisted coaches can view techniques"
  ON public.techniques FOR SELECT
  USING (public.is_allowlisted_coach());

-- Only admins can create custom techniques
DROP POLICY IF EXISTS "Admin coaches can create custom techniques" ON public.techniques;
CREATE POLICY "Admin coaches can create custom techniques"
  ON public.techniques FOR INSERT
  WITH CHECK (
    exists (
      select 1 from public.coach_allowlist ca
      join auth.users u on lower(u.email) = lower(ca.email)
      where auth.uid() = u.id and ca.is_admin = true
    )
  );

-- Only admins can update custom techniques (not standard Kodokan ones)
DROP POLICY IF EXISTS "Admin coaches can update custom techniques" ON public.techniques;
CREATE POLICY "Admin coaches can update custom techniques"
  ON public.techniques FOR UPDATE
  USING (
    is_custom = true AND
    exists (
      select 1 from public.coach_allowlist ca
      join auth.users u on lower(u.email) = lower(ca.email)
      where auth.uid() = u.id and ca.is_admin = true
    )
  )
  WITH CHECK (
    is_custom = true AND
    exists (
      select 1 from public.coach_allowlist ca
      join auth.users u on lower(u.email) = lower(ca.email)
      where auth.uid() = u.id and ca.is_admin = true
    )
  );

-- Only admins can delete custom techniques
DROP POLICY IF EXISTS "Admin coaches can delete custom techniques" ON public.techniques;
CREATE POLICY "Admin coaches can delete custom techniques"
  ON public.techniques FOR DELETE
  USING (
    is_custom = true AND
    exists (
      select 1 from public.coach_allowlist ca
      join auth.users u on lower(u.email) = lower(ca.email)
      where auth.uid() = u.id and ca.is_admin = true
    )
  );

-- 6. Seed example custom techniques
INSERT INTO public.techniques (name, category, subcategory, display_order, is_custom)
VALUES 
  ('Handcuff Turnover', 'Ne-waza', 'Custom', 1000, true),
  ('Cat''s Paw', 'Ne-waza', 'Custom', 1001, true),
  ('Cat Wrench', 'Ne-waza', 'Custom', 1002, true),
  ('SRT', 'Ne-waza', 'Custom', 1003, true),
  ('Fukuda Roll', 'Ne-waza', 'Custom', 1004, true)
ON CONFLICT DO NOTHING;
