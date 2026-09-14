alter table public.opponent_notes
  add column if not exists score_events jsonb not null default '[]'::jsonb;

comment on column public.opponent_notes.score_events is
  'Quick-capture score sequence. Array of {sequenceOrder, eventType, recipient?, techniqueId?, techniqueLabel?}';
