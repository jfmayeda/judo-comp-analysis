-- Allow yuko as a quick-capture score flavor. Recipient lives on score_events
-- jsonb and needs no column change. Do not apply this to production from the agent.

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'opponent_notes_score_flavor_check'
  ) then
    alter table public.opponent_notes
      drop constraint opponent_notes_score_flavor_check;
  end if;

  alter table public.opponent_notes
    add constraint opponent_notes_score_flavor_check
    check (
      score_flavor is null
      or score_flavor in ('ippon', 'waza_ari', 'yuko', 'osaekomi', 'golden_score', 'other')
    );
end $$;

comment on column public.opponent_notes.score_flavor is
  'Optional score flavor: ippon, waza_ari, yuko, osaekomi, golden_score, other';
