# UX Overhaul Plan — Prototype Canvas

Branch `fable/portfolio-ux-overhaul`. Companion to `UX_OVERHAUL_AUDIT.md` (findings) and
`UX_OVERHAUL_REVIEW.md` (post-implementation critique).

## Goal

**User outcome (hypothesis, pre-release):** a Silicon Valley Judo coach standing matside can open an athlete,
see the three things that matter (today's mat/coach, tokui-waza, what to watch for), and log a match result in
five taps or fewer, on a phone, with one hand, without reading labels. Creating an athlete should ask for a name
and belt and nothing else up front.

**Portfolio outcome:** demonstrate scoping discipline (DFV gate, cut list), design-system governance (brand
anchors vs. revisable interface rules, with rationale), safe AI-led execution (data contracts, auth, RLS,
privacy and assignment logic untouched; refactors limited to presentation), and evidence-based verification
(build, tests, browser smoke suite, before/after screenshots, tap counts).

Non-goals: backend, routing or framework changes; migrations; new integrations; badge art; analytics.

## What to Prototype

### Shared foundations (`app/globals.css`, `components/ui/*`)
- Load the Tailwind v4 theme and remap `gray/blue/red/green/yellow/orange` and radius utilities to SVJ tokens
  so every existing utility class renders on-brand.
- Type scale (28/22/18/16/14/13), spacing rhythm (4-base), focus ring, reduced motion, semantic state tints.
- Primitives: `PageShell` (default/narrow), `PageHeader` (kicker, `h1`, lead, actions), `SectionHeading`,
  `Field` (label + control + hint + error, wired with `htmlFor`), `Notice` (info/success/warning/danger),
  `EmptyState`, `LoadingScreen`, `Dialog` (role, labelledby, Escape, focus return), `StickyActions`
  (bottom, safe-area aware), `SampleDataTag`, `BeltMark`, `StatTile`, `MetaGrid`.
- `AppHeader` slimmed; `BottomNav` for phone (Roster · Opponents · Today).
- `useCoachGate()` hook replaces the six copies of the auth-redirect effect (behavior identical).

### Routes and workflows
| Route | Redesign |
| --- | --- |
| `/` Roster | Search box, athlete count, one primary action ("Add athlete"), belt mark + weight/stance meta, note count, "Today" pill for athletes on today's tournament day. Add form → `AthleteForm` with **Essentials** (first name, last initial, belt) visible; **Competition details** (stance, weight, division) and **Techniques & notes** (pickers, free text, development focus, notes) collapsed; inline validation and error notice; sticky bottom Save on phone. |
| `/athletes/[id]` | Order: `AthleteHero` (name, belt, meta, primary actions: Capture, Print, Edit) → `TodayCard` (mat/coach/time when assigned) → `FocusCard` (development focus + coaching notes) → `TechniqueCard` (tokui-waza, ne-waza, kumi-kata) → `OpponentIntelCard` (notes + add form, captured-result headline) → `DevelopmentCard` (Activity + Badges, one story) → `PromotionsCard` → `AdminCard` (preferred coach, opt-out/delete, admin only). Edit uses the same `AthleteForm` with all groups open. Quick Capture opens as a sheet **above** the hero. |
| Quick Capture | Step 1 visible: Result (Win/Loss/Other, 48px). Opponent defaults to **Unknown** (a valid state). Score chips (Ippon, Waza-ari, Osaekomi, Golden score, Shido us/them) in one row, technique picker shown only after a scoring tap. "Add detail" disclosure hides How/Note/opponent modes. Sticky Save with live summary; success notice after save. Persistence contract unchanged (`saveQuickCapture`). |
| `/tournament-day` | Next action first: "Today · Bay Area Open" header, count, primary "Assign coaches" when athletes are selected. Roster rows (`RosterRow`) with fixed-width action group and `min-width: 0` names; selection is a real `role="checkbox"` card; selections auto-save with a status line (same `setTournamentDayAthletes` call, debounced) plus explicit Save kept for offline. Offline readiness moved into a quiet `Notice`. |
| `/tournament-day/assign` | Summary tiles → view toggle → entry cards with three fields on one row at tablet+; conflicts as warning `Notice`; auto-assign preview in `Dialog`. Auto-assign logic (`lib/coach-auto-assign.ts`) untouched. |
| Activity & Badges | `DevelopmentCard`: "Captured results" list built from existing `opponentNotes` with `result`/`scoreEvents` (real data, no schema change) with W/L summary; below it "Sample tournament history" and "Sample badges" only for sample athletes, each wrapped in a clearly labelled sample band; empty state for real athletes without captures; badges grouped Earned / In progress / Locked with token colours, keyboard-accessible detail dialog. |
| Secondary (`/opponents`, `/invite`, `/login`, `/unauthorized`, `/admin/design-tokens`, print) | Use the primitives, remove literal colours and emoji, associate labels, print styles verified. |

### Route-by-route acceptance matrix
| Route | 390 | 768 | 1440 | Keyboard | States | Regression checks |
| --- | --- | --- | --- | --- | --- | --- |
| `/login` | no overflow, labels wired | ✓ | ✓ | tab order email→password→submit→toggle | error, sent-link message | magic link + password paths unchanged |
| `/` | bottom nav visible, one primary CTA | 2-col grid | 3-col grid | search → cards → add | loading, empty, error, add-form validation | `createAthlete` payload shape unchanged |
| `/athletes/[id]` | hero first, capture sheet above | 2-col where useful | 2-col | all buttons reachable, dialog focus | not found, sparse athlete, rich athlete, sample athlete | update/delete/note/promotion calls unchanged; admin-only delete |
| Quick Capture | ≤5 taps to save basic result | ✓ | ✓ | chips are buttons with `aria-pressed` | disabled save, saving, error, saved | write shape asserted by smoke test |
| `/opponents` | ✓ | ✓ | ✓ | ✓ | empty, no match, edit | CRUD calls unchanged |
| `/tournament-day` | rows don't wrap names, visible checkbox | ✓ | ✓ | checkbox cards toggle with Space/Enter | no athletes, none selected, selected, offline | `setTournamentDayAthletes`, print URL, sync unchanged |
| `/tournament-day/assign` | fields stack | fields in a row | ✓ | dialog Escape/focus | empty day, conflicts, preview | `autoAssignCoaches` untouched; `updateTournamentDayEntry` shape unchanged |
| `/invite`, `/admin/design-tokens` | ✓ | ✓ | ✓ | ✓ | admin gate redirect | allowlist calls unchanged |
| print routes | readable | ✓ | ✓ | n/a | QR present, no-print chrome hidden | `@media print` rules |
| `/unauthorized` | ✓ | ✓ | ✓ | ✓ | — | sign-out clears cache |

## How to Test

1. **Build and automated checks** — `npm run build` (with the font mock in sandboxes without Google Fonts),
   `npm test` (unit), `npm run smoke` (browser suite against `next start`).
2. **Existing logic tests** — capture-score, meta-row, technique chips and the technique-picker CSS tests keep
   passing; tests added for any changed pure logic (`athlete-form` validation/grouping, `development-summary`
   derived from captured notes, `tap-count` helpers if any).
3. **Responsive screenshot review** — `scripts/ui-smoke/screenshots.mjs --out docs/screenshots/after`, same 19
   scenes as baseline; horizontal-overflow flag per scene.
4. **Keyboard and focus** — smoke test tabs through login, roster add form and Quick Capture and asserts the
   focused element has a visible outline; dialogs return focus on close.
5. **States** — fixtures include empty roster, sparse athlete, rich athlete, sample athlete, no-selection
   tournament day, conflicts on the assign board; loading and error states forced by delaying/failing mocked
   responses.
6. **Regression checks** — print routes render with `.no-print` hidden; `sw.js` untouched and registration
   unchanged; auth gate redirects still fire (smoke test with `login:false`); privacy: fixtures and UI only ever
   render `First L.`; Quick Capture write shape (`result`, `score_flavor`, `score_events`, `technique_ids`,
   `opponent_label`) asserted against the mock's write log; `lib/coach-auto-assign.ts` diff is empty.

## Learning Metrics

| Metric | Baseline (measured on `main`) | Target | After (measured) |
| --- | --- | --- | --- |
| Taps from "Quick capture" opening to a saved Win with Ippon | 4 taps + 1 scroll (Win → Ippon → scroll → Save; opponent defaults to "Club list" which cannot save until a row is chosen, so the fast path is Unknown: Win → Unknown → Ippon → Save = 4 + scroll) | ≤ 5 taps, no scroll | filled in `UX_OVERHAUL_REVIEW.md` |
| Fields visible when "Add athlete" opens | 14 (2 required) | 3 visible (2 required), rest disclosed | — |
| Steps to create a minimal athlete | Add athlete → first name → last initial → scroll ~2,000px → Create = 4 inputs + long scroll | 3 inputs + Save without scrolling on 390px | — |
| Horizontal overflow at 390/768/1440 | none detected (but layouts collapse) | none | — |
| Interactive elements under 40px tall on core routes | measured by smoke test | 0 on primary actions | — |
| Sample vs. persisted data distinguishable | tag only, sections hidden for real athletes | explicit bands + empty states | — |
| Navigation labels understandable without implementation knowledge | "Roster / Opponents / Tournament Day / Invite Coaches / Design Tokens" | "Roster / Opponents / Today" + admin under a separate group | — |

## Self-review against constraints

- No Supabase migrations, RLS, auth config, secrets or production data are touched. ✔
- Data-layer function signatures unchanged; UI calls the same functions with the same payloads. ✔
- Privacy naming (`First L.`), no photos, opt-out cascade modal, print/QR, SW registration, auto-assign logic
  preserved. ✔
- Refactors are presentational extractions; fragile logic gains tests before change. ✔
- Scope fits Must first; Should only after Must is green. ✔

Proceeding without waiting for approval, per the run brief.
