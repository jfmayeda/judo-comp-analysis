-- Match intel fields for matside quick capture on opponent_notes.
-- Result and score flavor stay optional so existing scouting notes stay valid.

alter table public.opponent_notes
  add column if not exists result text;

alter table public.opponent_notes
  add column if not exists score_flavor text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'opponent_notes_result_check'
  ) then
    alter table public.opponent_notes
      add constraint opponent_notes_result_check
      check (result is null or result in ('win', 'loss', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'opponent_notes_score_flavor_check'
  ) then
    alter table public.opponent_notes
      add constraint opponent_notes_score_flavor_check
      check (
        score_flavor is null
        or score_flavor in ('ippon', 'waza_ari', 'osaekomi', 'golden_score', 'other')
      );
  end if;
end $$;

comment on column public.opponent_notes.result is 'Quick-capture match result: win, loss, or other (draw etc.)';
comment on column public.opponent_notes.score_flavor is 'Optional score flavor: ippon, waza_ari, osaekomi, golden_score, other';
