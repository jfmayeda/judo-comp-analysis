-- Coach Fight Assignment Feature
-- Add preferred/locked coach on athlete and assignment board fields

-- Add preferred coach fields to athletes table
alter table public.athletes
  add column if not exists preferred_coach_id uuid references public.coach_allowlist(id) on delete set null,
  add column if not exists is_coach_locked boolean not null default false,
  add column if not exists coach_is_exclusive boolean not null default false;

-- Add assignment fields to tournament_day_entries
alter table public.tournament_day_entries
  add column if not exists assigned_coach_id uuid references public.coach_allowlist(id) on delete set null,
  add column if not exists mat_number text,
  add column if not exists time_window text,
  add column if not exists no_coach_needed boolean not null default false;

-- Indexes for performance
create index if not exists athletes_preferred_coach_id_idx on public.athletes(preferred_coach_id);
create index if not exists tournament_day_entries_assigned_coach_id_idx on public.tournament_day_entries(assigned_coach_id);

-- Comments for clarity
comment on column public.athletes.is_coach_locked is 'When true, this athlete must always be assigned their preferred coach';
comment on column public.athletes.coach_is_exclusive is 'When true, the preferred coach is dedicated to this athlete only and should not coach others';
comment on column public.tournament_day_entries.no_coach_needed is 'When true, no coach assignment needed (e.g. SVJ vs SVJ in-house match)';
