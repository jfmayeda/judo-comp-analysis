-- Tournament Day Feature
-- Add tournament day tracking for coaches to select which athletes are competing today

-- Tournament days table
create table if not exists public.tournament_days (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  day date not null default current_date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete cascade
);

-- Tournament day entries (which athletes are competing)
create table if not exists public.tournament_day_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_day_id uuid not null references public.tournament_days(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(tournament_day_id, athlete_id)
);

-- RLS policies for tournament_days
alter table public.tournament_days enable row level security;

create policy "Authenticated users can view tournament days"
  on public.tournament_days for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create tournament days"
  on public.tournament_days for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update tournament days"
  on public.tournament_days for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete tournament days"
  on public.tournament_days for delete
  using (auth.role() = 'authenticated');

-- RLS policies for tournament_day_entries
alter table public.tournament_day_entries enable row level security;

create policy "Authenticated users can view tournament day entries"
  on public.tournament_day_entries for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create tournament day entries"
  on public.tournament_day_entries for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete tournament day entries"
  on public.tournament_day_entries for delete
  using (auth.role() = 'authenticated');

-- Indexes for performance
create index if not exists tournament_days_created_by_idx on public.tournament_days(created_by);
create index if not exists tournament_days_day_idx on public.tournament_days(day);
create index if not exists tournament_day_entries_tournament_day_id_idx on public.tournament_day_entries(tournament_day_id);
create index if not exists tournament_day_entries_athlete_id_idx on public.tournament_day_entries(athlete_id);
