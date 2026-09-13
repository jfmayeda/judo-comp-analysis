-- Fix coach_allowlist RLS to unblock access
-- Migration mirrors production fix applied to JudoCoach (wnwcxousneqhzlkdzeku)
-- Root cause: RLS SELECT policy queried auth.users which client/JWT path couldn't satisfy

-- Create coach_allowlist table if not exists
create table if not exists public.coach_allowlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Security definer functions using JWT email claim (no auth.users dependency)
create or replace function public.is_allowlisted_coach()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.coach_allowlist
    where lower(email) = lower(auth.jwt()->>'email')
  );
$$;

create or replace function public.is_admin_coach()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.coach_allowlist
    where lower(email) = lower(auth.jwt()->>'email')
      and is_admin = true
  );
$$;

-- Enable RLS
alter table public.coach_allowlist enable row level security;

-- RLS policies using security definer functions and JWT claims
-- SELECT own row: user can read their own allowlist entry via JWT email
create policy "Coaches can view own allowlist entry"
  on public.coach_allowlist for select
  using (lower(email) = lower(auth.jwt()->>'email'));

-- Admin full CRUD via is_admin_coach()
create policy "Admin coaches can view all allowlist entries"
  on public.coach_allowlist for select
  using (is_admin_coach());

create policy "Admin coaches can insert allowlist entries"
  on public.coach_allowlist for insert
  with check (is_admin_coach());

create policy "Admin coaches can update allowlist entries"
  on public.coach_allowlist for update
  using (is_admin_coach());

create policy "Admin coaches can delete allowlist entries"
  on public.coach_allowlist for delete
  using (is_admin_coach());

-- Seed both admin emails (matching production)
insert into public.coach_allowlist (email, is_admin)
values
  ('jacobfmayeda@gmail.com', true),
  ('jacobbhohn@gmail.com', true)
on conflict (email) do update
  set is_admin = excluded.is_admin,
      updated_at = now();

-- Trigger to update updated_at timestamp
create or replace function public.update_coach_allowlist_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger coach_allowlist_updated_at
  before update on public.coach_allowlist
  for each row
  execute function public.update_coach_allowlist_updated_at();

-- Index for performance
create index if not exists coach_allowlist_email_idx on public.coach_allowlist(lower(email));
