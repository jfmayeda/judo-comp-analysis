-- Coach-rated D&D-style stats for SVJ athletes.
-- Write-only in this repo: do not apply to production from this change.

create table if not exists public.athlete_stats (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  athleticism smallint not null check (athleticism between 1 and 20),
  athleticism_note text not null default '',
  strength smallint not null check (strength between 1 and 20),
  strength_note text not null default '',
  speed smallint not null check (speed between 1 and 20),
  speed_note text not null default '',
  technique smallint not null check (technique between 1 and 20),
  technique_note text not null default '',
  rated_at timestamptz not null default now(),
  rated_by_email text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists athlete_stats_rated_at_idx on public.athlete_stats (rated_at desc);

alter table public.athlete_stats enable row level security;

drop policy if exists "Allowlisted coaches can view athlete_stats" on public.athlete_stats;
create policy "Allowlisted coaches can view athlete_stats"
  on public.athlete_stats for select
  using (public.is_allowlisted_coach());

drop policy if exists "Allowlisted coaches can create athlete_stats" on public.athlete_stats;
create policy "Allowlisted coaches can create athlete_stats"
  on public.athlete_stats for insert
  with check (public.is_allowlisted_coach());

drop policy if exists "Allowlisted coaches can update athlete_stats" on public.athlete_stats;
create policy "Allowlisted coaches can update athlete_stats"
  on public.athlete_stats for update
  using (public.is_allowlisted_coach())
  with check (public.is_allowlisted_coach());

drop policy if exists "Allowlisted coaches can delete athlete_stats" on public.athlete_stats;
create policy "Allowlisted coaches can delete athlete_stats"
  on public.athlete_stats for delete
  using (public.is_allowlisted_coach());
