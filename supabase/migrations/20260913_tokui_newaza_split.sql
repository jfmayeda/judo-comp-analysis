-- Split technique_ids into tokui_technique_ids (Tachi-waza) and newaza_technique_ids (Ne-waza)
-- This allows separate pickers for standing techniques vs ground techniques

-- Add new split columns to athletes table
alter table public.athletes add column if not exists tokui_technique_ids uuid[] default '{}';
alter table public.athletes add column if not exists newaza_technique_ids uuid[] default '{}';

-- Add new split columns to opponent_notes table
alter table public.opponent_notes add column if not exists tokui_technique_ids uuid[] default '{}';
alter table public.opponent_notes add column if not exists newaza_technique_ids uuid[] default '{}';

-- Add new split columns to opponents table
alter table public.opponents add column if not exists tokui_technique_ids uuid[] default '{}';
alter table public.opponents add column if not exists newaza_technique_ids uuid[] default '{}';

-- Migrate existing technique_ids to appropriate arrays based on technique category
-- For athletes
update public.athletes
set 
  tokui_technique_ids = (
    select array_agg(t.id)
    from unnest(technique_ids) as tid
    join public.techniques t on t.id = tid
    where t.category = 'Tachi-waza'
  ),
  newaza_technique_ids = (
    select array_agg(t.id)
    from unnest(technique_ids) as tid
    join public.techniques t on t.id = tid
    where t.category = 'Ne-waza'
  )
where technique_ids is not null and array_length(technique_ids, 1) > 0;

-- For opponent_notes
update public.opponent_notes
set 
  tokui_technique_ids = (
    select array_agg(t.id)
    from unnest(technique_ids) as tid
    join public.techniques t on t.id = tid
    where t.category = 'Tachi-waza'
  ),
  newaza_technique_ids = (
    select array_agg(t.id)
    from unnest(technique_ids) as tid
    join public.techniques t on t.id = tid
    where t.category = 'Ne-waza'
  )
where technique_ids is not null and array_length(technique_ids, 1) > 0;

-- For opponents
update public.opponents
set 
  tokui_technique_ids = (
    select array_agg(t.id)
    from unnest(technique_ids) as tid
    join public.techniques t on t.id = tid
    where t.category = 'Tachi-waza'
  ),
  newaza_technique_ids = (
    select array_agg(t.id)
    from unnest(technique_ids) as tid
    join public.techniques t on t.id = tid
    where t.category = 'Ne-waza'
  )
where technique_ids is not null and array_length(technique_ids, 1) > 0;

-- Comments for documentation
comment on column public.athletes.tokui_technique_ids is 'Array of Tachi-waza technique UUIDs for tokui-waza (standing techniques)';
comment on column public.athletes.newaza_technique_ids is 'Array of Ne-waza technique UUIDs (ground techniques)';
comment on column public.opponent_notes.tokui_technique_ids is 'Array of Tachi-waza technique UUIDs for opponent notes';
comment on column public.opponent_notes.newaza_technique_ids is 'Array of Ne-waza technique UUIDs for opponent notes';
comment on column public.opponents.tokui_technique_ids is 'Array of Tachi-waza technique UUIDs for opponent tokui-waza';
comment on column public.opponents.newaza_technique_ids is 'Array of Ne-waza technique UUIDs for opponent ne-waza';

-- Keep old technique_ids columns for now (can be dropped later after verification)
-- alter table public.athletes drop column if exists technique_ids;
-- alter table public.opponent_notes drop column if exists technique_ids;
-- alter table public.opponents drop column if exists technique_ids;
