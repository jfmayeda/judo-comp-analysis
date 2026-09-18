# PR: UX/UI overhaul — matside hierarchy, low-friction data entry, design-system foundations

**Branch:** `fable/portfolio-ux-overhaul` → `main` · **Draft** · do not merge without human review · no
deploy to Production from this PR.

## What changed

**Foundations (root cause).** Tailwind v4 was installed but `globals.css` still used v3 directives, so the
compiled CSS had no spacing/type scales, no palette and zero `md:` variants. This PR loads the v4 theme and
remaps Tailwind's palette, type scale and radii onto the `--svj-*` tokens, adds a universal focus ring,
reduced-motion support, and a set of primitives (`PageHeader`, `SectionHeading`, `Field`, `Notice`,
`EmptyState`, `Dialog`, `ConfirmDialog`, `Disclosure`, `StickyActions`, `StatTile`, `BeltMark`, `SampleData`,
`Icons`). Slim header + phone bottom nav (`AppFrame`). `DESIGN.md` rewritten: brand anchors vs. product rules.

**Roster & athlete entry.** Search, one primary action, `AthleteForm` with essentials visible (name, initial,
belt) and everything else disclosed; inline validation; sticky Save. Payloads to `createAthlete`/`updateAthlete`
unchanged (tested).

**Athlete detail.** 1,158 → 313 lines; sections extracted under `components/athlete/`: hero → Today →
Development focus → Techniques → Opponent intel → Development → Belt history → Administration.

**Quick Capture.** Result first, opponent defaults to Unknown, score sequence/technique/notes disclosed, Save
on screen with live summary, success notice. `saveQuickCapture` contract unchanged; write shape asserted.

**Tournament day & assignment.** Roster rows that never wrap names, real checkbox cards, dirty-tracked
Save, offline block; assign board on primitives with auto-assign preview in an accessible dialog.
`lib/coach-auto-assign.ts` untouched.

**Activity & Badges.** One "Development" card: real captured results (from existing `opponent_notes`
capture fields — no schema change) with W/L tally; sample tournament history and badges only for sample
athletes, inside labelled sample bands; badges grouped Earned / In progress with token colours.

**Secondary.** Opponents, login, unauthorized, invite, token gallery and print pages on the system.
`alert()`/`confirm()` replaced by `Notice`/`ConfirmDialog`; emoji removed.

## Untouched on purpose
`lib/supabase-store.ts`, `lib/quick-capture.ts`, `lib/coach-auto-assign.ts`, `lib/auth-context.tsx`,
`lib/auth-utils.ts`, `public/sw.js`, `app/sw-register.tsx`, `supabase/` — empty diff vs `main`. No
migrations, RLS, auth config, secrets or production data.

## Verification
- `npm run build` ✅ · `npm test` 23/23 ✅ · `npm run smoke` 116/116 ✅ (Playwright + in-memory Supabase mock;
  auth boundaries, overflow at 390/768/1440, touch targets, Quick Capture write shape and tap count, athlete
  create shape, tournament-day save, auto-assign PATCH shape incl. locked/exclusive coaches, keyboard focus,
  dialog focus return, privacy naming)
- Before/after screenshots: `docs/screenshots/{baseline,after}/` (19 scenes × 3 widths)
- Docs: `docs/UX_OVERHAUL_AUDIT.md`, `docs/UX_OVERHAUL_PLAN.md`, `docs/UX_OVERHAUL_REVIEW.md`,
  `docs/PORTFOLIO_CASE_STUDY.md`

## Reviewer notes
- Fonts: the sandbox could not reach Google Fonts, so builds used `NEXT_FONT_GOOGLE_MOCKED_RESPONSES`; the
  Vercel preview is the first place to eyeball Michroma/Archivo/Source Sans rendering.
- New dev dependencies: `tsx`, `playwright` (Chromium is expected at `/opt/pw-browsers/chromium` or via
  `SMOKE_CHROMIUM`).
- Remaining issues, ordered by impact, are in `docs/PORTFOLIO_CASE_STUDY.md` §12 and the review doc.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_017HhGn9aLPSh3AvE72BwimC
