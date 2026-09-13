-- Coach Allowlist Feature
-- Only invited/allowlisted coaches can access athlete data

-- Coach allowlist table
create table if not exists public.coach_allowlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  is_admin boolean not null default false
);

-- Index for fast email lookups
create index if not exists coach_allowlist_email_idx on public.coach_allowlist(email);

-- RLS for coach_allowlist table
alter table public.coach_allowlist enable row level security;

-- Only allowlisted coaches can view the allowlist
create policy "Allowlisted coaches can view coach_allowlist"
  on public.coach_allowlist for select
  using (
    exists (
      select 1 from auth.users
      where auth.uid() = auth.users.id
      and lower(auth.users.email) in (select lower(email) from public.coach_allowlist)
    )
  );

-- Only admin coaches can insert/update/delete from allowlist
create policy "Admin coaches can manage coach_allowlist"
  on public.coach_allowlist for all
  using (
    exists (
      select 1 from public.coach_allowlist ca
      join auth.users u on lower(u.email) = lower(ca.email)
      where auth.uid() = u.id and ca.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.coach_allowlist ca
      join auth.users u on lower(u.email) = lower(ca.email)
      where auth.uid() = u.id and ca.is_admin = true
    )
  );

-- Helper function to check if a user is an allowlisted coach
create or replace function public.is_allowlisted_coach()
returns boolean as $$
  select exists (
    select 1 
    from auth.users u
    join public.coach_allowlist ca on lower(u.email) = lower(ca.email)
    where u.id = auth.uid()
  );
$$ language sql security definer;

-- Update RLS policies for athletes table
drop policy if exists "athletes_select_authenticated" on public.athletes;
drop policy if exists "athletes_insert_authenticated" on public.athletes;
drop policy if exists "athletes_update_authenticated" on public.athletes;
drop policy if exists "athletes_delete_authenticated" on public.athletes;

create policy "Allowlisted coaches can view athletes"
  on public.athletes for select
  using (public.is_allowlisted_coach());

create policy "Allowlisted coaches can create athletes"
  on public.athletes for insert
  with check (public.is_allowlisted_coach());

create policy "Allowlisted coaches can update athletes"
  on public.athletes for update
  using (public.is_allowlisted_coach())
  with check (public.is_allowlisted_coach());

create policy "Allowlisted coaches can delete athletes"
  on public.athletes for delete
  using (public.is_allowlisted_coach());

-- Update RLS policies for opponent_notes table
drop policy if exists "opponent_notes_select_authenticated" on public.opponent_notes;
drop policy if exists "opponent_notes_insert_authenticated" on public.opponent_notes;
drop policy if exists "opponent_notes_update_authenticated" on public.opponent_notes;
drop policy if exists "opponent_notes_delete_authenticated" on public.opponent_notes;

create policy "Allowlisted coaches can view opponent_notes"
  on public.opponent_notes for select
  using (public.is_allowlisted_coach());

create policy "Allowlisted coaches can create opponent_notes"
  on public.opponent_notes for insert
  with check (public.is_allowlisted_coach());

create policy "Allowlisted coaches can update opponent_notes"
  on public.opponent_notes for update
  using (public.is_allowlisted_coach())
  with check (public.is_allowlisted_coach());

create policy "Allowlisted coaches can delete opponent_notes"
  on public.opponent_notes for delete
  using (public.is_allowlisted_coach());

-- Update RLS policies for opponents table
drop policy if exists "opponents_select" on public.opponents;
drop policy if exists "opponents_insert" on public.opponents;
drop policy if exists "opponents_update" on public.opponents;
drop policy if exists "opponents_delete" on public.opponents;

create policy "Allowlisted coaches can view opponents"
  on public.opponents for select
  using (public.is_allowlisted_coach());

create policy "Allowlisted coaches can create opponents"
  on public.opponents for insert
  with check (public.is_allowlisted_coach());

create policy "Allowlisted coaches can update opponents"
  on public.opponents for update
  using (public.is_allowlisted_coach())
  with check (public.is_allowlisted_coach());

create policy "Allowlisted coaches can delete opponents"
  on public.opponents for delete
  using (public.is_allowlisted_coach());

-- Update RLS policies for tournament_days table
drop policy if exists "tournament_days_select" on public.tournament_days;
drop policy if exists "tournament_days_insert" on public.tournament_days;
drop policy if exists "tournament_days_update" on public.tournament_days;
drop policy if exists "tournament_days_delete" on public.tournament_days;

create policy "Allowlisted coaches can view tournament_days"
  on public.tournament_days for select
  using (public.is_allowlisted_coach());

create policy "Allowlisted coaches can create tournament_days"
  on public.tournament_days for insert
  with check (public.is_allowlisted_coach());

create policy "Allowlisted coaches can update tournament_days"
  on public.tournament_days for update
  using (public.is_allowlisted_coach())
  with check (public.is_allowlisted_coach());

create policy "Allowlisted coaches can delete tournament_days"
  on public.tournament_days for delete
  using (public.is_allowlisted_coach());

-- Update RLS policies for tournament_day_entries table
drop policy if exists "tournament_day_entries_select" on public.tournament_day_entries;
drop policy if exists "tournament_day_entries_insert" on public.tournament_day_entries;
drop policy if exists "tournament_day_entries_update" on public.tournament_day_entries;
drop policy if exists "tournament_day_entries_delete" on public.tournament_day_entries;

create policy "Allowlisted coaches can view tournament_day_entries"
  on public.tournament_day_entries for select
  using (public.is_allowlisted_coach());

create policy "Allowlisted coaches can create tournament_day_entries"
  on public.tournament_day_entries for insert
  with check (public.is_allowlisted_coach());

create policy "Allowlisted coaches can update tournament_day_entries"
  on public.tournament_day_entries for update
  using (public.is_allowlisted_coach())
  with check (public.is_allowlisted_coach());

create policy "Allowlisted coaches can delete tournament_day_entries"
  on public.tournament_day_entries for delete
  using (public.is_allowlisted_coach());

-- Seed existing coaches into the allowlist (both users become admins)
insert into public.coach_allowlist (email, is_admin)
values 
  ('jacobbhohn@gmail.com', true),
  ('jacobfmayeda@gmail.com', true)
on conflict (email) do nothing;
