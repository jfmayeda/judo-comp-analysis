-- Family Access Feature
-- Parents/guardians can log in and see/edit ONLY their linked athlete(s)
-- Coaches retain full access (existing behavior unchanged)

-- Family access table
create table if not exists public.family_access (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  email text not null,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Unique constraint: one invitation per (email, athlete) pair
create unique index if not exists family_access_email_athlete_idx 
  on public.family_access(lower(email), athlete_id);

-- Index for fast email lookups
create index if not exists family_access_email_idx 
  on public.family_access(lower(email));

-- Enable RLS
alter table public.family_access enable row level security;

-- RLS: Admin coaches can manage family access (invite/revoke)
create policy "Admin coaches can manage family_access"
  on public.family_access for all
  using (is_admin_coach())
  with check (is_admin_coach());

-- RLS: Family users can view their own access grants
create policy "Family can view own access grants"
  on public.family_access for select
  using (lower(email) = lower(auth.jwt()->>'email'));

-- Security definer helper: check if current user is family for given athlete
create or replace function public.is_family_for_athlete(athlete_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.family_access
    where lower(email) = lower(auth.jwt()->>'email')
      and family_access.athlete_id = is_family_for_athlete.athlete_id
  );
$$;

-- Security definer helper: check if user can access athlete (coach OR family)
create or replace function public.can_access_athlete(athlete_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select public.is_allowlisted_coach() or public.is_family_for_athlete(athlete_id);
$$;

-- Security definer helper: get linked athlete IDs for current user
-- Returns empty array for coaches (they have full access)
-- Returns athlete IDs for family users
create or replace function public.get_linked_athlete_ids()
returns uuid[]
language sql
security definer
stable
as $$
  select coalesce(
    array_agg(athlete_id),
    array[]::uuid[]
  )
  from public.family_access
  where lower(email) = lower(auth.jwt()->>'email');
$$;

-- Update athletes RLS: family can SELECT their linked athlete(s)
create policy "Family can view linked athletes"
  on public.athletes for select
  using (is_family_for_athlete(id));

-- Update athletes RLS: family can UPDATE limited fields on linked athlete(s)
-- Note: Column-level restrictions enforced in app layer
-- Family cannot change: created_at, updated_at, preferred_coach_id, is_coach_locked, coach_is_exclusive
create policy "Family can update linked athletes"
  on public.athletes for update
  using (is_family_for_athlete(id))
  with check (is_family_for_athlete(id));

-- Family CANNOT delete athletes (admin-only via existing coach policies)

-- Update opponent_notes RLS: family can SELECT notes for their linked athlete(s)
create policy "Family can view opponent notes for linked athletes"
  on public.opponent_notes for select
  using (is_family_for_athlete(athlete_id));

-- Family can UPDATE opponent notes for their linked athlete (safe fields only via app)
create policy "Family can update opponent notes for linked athletes"
  on public.opponent_notes for update
  using (is_family_for_athlete(athlete_id))
  with check (is_family_for_athlete(athlete_id));

-- Family can INSERT opponent notes for their linked athlete
create policy "Family can create opponent notes for linked athletes"
  on public.opponent_notes for insert
  with check (is_family_for_athlete(athlete_id));

-- Family CANNOT delete opponent notes (coach-only via existing policies)

-- Update promotions RLS: family can SELECT promotions for their linked athlete(s)
create policy "Family can view promotions for linked athletes"
  on public.promotions for select
  using (is_family_for_athlete(athlete_id));

-- Family CANNOT insert/update/delete promotions (coach-only)

-- Family CANNOT access opponents directory (coach-only, no policy for family)
-- Family CANNOT access tournament_days or tournament_day_entries (coach-only)
-- Family CANNOT access coach_allowlist (existing admin-only policies)

-- Note: Coaches retain all existing policies (unchanged)
-- The new family policies run alongside coach policies (additive security model)
