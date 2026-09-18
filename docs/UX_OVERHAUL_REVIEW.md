# UX Overhaul Review — Autonomous Feedback Capture Grid

Reviewed after the first complete pass, using the "after" screenshots in `docs/screenshots/after/`
(19 scenes × 390/768/1440) and the smoke-suite output. This is a self-review by the implementing agent, not
coach feedback. Items marked **fixed** were corrected in the single correction pass that followed; everything
else is carried into "Remaining issues" in `PORTFOLIO_CASE_STUDY.md`.

## I Like

- **Hierarchy on the athlete page finally reads top-down**: name + belt + two primary actions → Today
  (mat/coach/time) → Development focus → Techniques → Opponent intel → Development → Belt history →
  Administration. The name and the print button appear once each (baseline: three times and twice).
- **Quick capture is a two-to-four tap job** and the Save button is on screen the moment it opens
  (smoke: 4 taps including the opening tap for Win + Ippon; 2 taps for a bare result).
- **Roster cards carry the right three facts** (belt stripe, stance/weight/division, development focus)
  and the "Today · Mat 1" pill connects the roster to tournament day without a second screen.
- **Tournament day names no longer wrap one letter per line**, the checkbox is visible and is a real
  `role="checkbox"`, and "unsaved changes" is explicit in the sticky bar.
- **Sample data is unmistakable**: dashed warning-tinted bands with a "Sample data" tag around the
  demo tournament history and badges; real athletes see captured results (real, from Quick capture) and an
  honest "not tracked yet" line instead of a hidden section.
- **One scheme**: no emoji, no hex literals outside the token file, Tailwind palette classes resolve to SVJ
  tokens, and the token gallery shows every primitive.
- **Zero horizontal overflow and zero console errors** across all 57 captured scenes; 116/116 smoke checks.

## I Wish

- Today card: coach name and time window overflowed their stat tiles at 390px. **Fixed** — text values use a
  smaller `StatTile size="sm"` and the grid lets Mat stay compact.
- "Delete" ghost links in red on every opponent note and promotion row pulled the eye away from content.
  **Fixed** — `ghost-danger` is gray at rest and red on hover/focus; the red lives in the confirm dialog.
- Roster cards did not say which athletes are samples. **Fixed** — `SampleDataTag` on the card.
- Phone header context label truncated to "MAY…" because it had no flex share. **Fixed**.
- The badge grid for the demo athlete is 34 tiles tall on a phone. **Fixed** — first 12 earned badges shown
  with "Show all 34".
- The athlete edit form is long even with disclosures open (edit opens every group by design). A future pass
  could keep groups collapsed on edit and show a per-group "n filled" summary.
- The Opponent intel list and the Development card both list captured results; on a phone this is
  duplication. It is deliberate for now (intel is per-opponent, development is per-athlete) but should be
  tested with coaches.
- Print pages were only lightly touched (tokens, no overflow, single `h1`). They still use their own layout
  rather than the primitives.

## What If

- Quick capture could open as a bottom sheet from the Today roster row without leaving the tournament page.
- The Today page could auto-save selection with an undo toast instead of a sticky Save (kept explicit save
  because offline coaches may prefer a deliberate write).
- Technique tags on the athlete hero could be tappable filters into Opponent intel ("who did we beat with
  seoi-nage?").
- Captured results could feed the badge counters (e.g. Ippon Machine) without a schema change, since counts
  can be derived from `opponent_notes`. Not done here because badge semantics need a product decision.

## Questions (need coach validation)

1. Is "Development focus" the right first thing after the name, or do coaches want opponent intel first
   when they are literally matside?
2. Does "Unknown opponent" as the default make captures faster in practice, or does it produce notes coaches
   later cannot place?
3. Is the bottom tab bar (Roster · Opponents · Today) the right three, or should "Today" be the home tab on
   tournament days?
4. Do coaches want the score sequence at all, or just result + how? (The sequence is optional now.)
5. Is the belt-history section worth its space on the profile, or should it live behind "Administration"?
6. Print pack: is one page per athlete still the right unit, or a two-column matside sheet?

## Correction pass summary

Five fixes (above), rebuilt, `npm test` 23/23, `npm run smoke` 116/116, screenshots re-captured.
