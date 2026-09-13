-- Shared Opponents Feature
-- Create a reusable opponents database that can be attached to multiple athlete notes

-- Opponents table (club-wide reusable records)
create table if not exists public.opponents (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_initial text not null check (length(last_initial) = 1),
  club text,
  stance text check (stance in ('left', 'right', 'unknown')),
  kumi_kata text not null default '',
  ne_waza text not null default '',
  common_counters text not null default '',
  weight_class text not null default '',
  age_division text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete cascade
);

-- Add opponent_id to opponent_notes (nullable FK with SET NULL on delete)
alter table public.opponent_notes 
  add column if not exists opponent_id uuid references public.opponents(id) on delete set null;

-- RLS policies for opponents
alter table public.opponents enable row level security;

create policy "Authenticated users can view opponents"
  on public.opponents for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create opponents"
  on public.opponents for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update opponents"
  on public.opponents for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete opponents"
  on public.opponents for delete
  using (auth.role() = 'authenticated');

-- Indexes for performance
create index if not exists opponents_created_by_idx on public.opponents(created_by);
create index if not exists opponents_name_idx on public.opponents(first_name, last_initial);
create index if not exists opponents_club_idx on public.opponents(club);
create index if not exists opponent_notes_opponent_id_idx on public.opponent_notes(opponent_id);

-- Trigger to update updated_at timestamp
create or replace function public.update_opponents_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger opponents_updated_at
  before update on public.opponents
  for each row
  execute function public.update_opponents_updated_at();
