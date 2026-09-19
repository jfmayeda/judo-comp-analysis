# Case Study — Silicon Valley Judo Competitor Analysis: Pre-release UX Overhaul

> Portfolio artifact. Everything below is either a measured fact about the codebase (labelled *measured*),
> an expert heuristic judgement (labelled *heuristic*), or a hypothesis for coach testing (labelled
> *hypothesis*). No coach has used this build yet; no usage or satisfaction outcomes are claimed.

## 1. Product and user problem

Silicon Valley Judo coaches need, on a phone, matside, with one hand: an athlete's development focus and
techniques, what to watch for against a known opponent, and a way to log a match result in seconds. The app
is privacy-first (first name + last initial, no photos, opt-out cascade delete) and works offline for
tournament days. It also has to be maintainable by a small, part-AI team.

## 2. Why the pre-release experience needed an overhaul

*Measured.* Tailwind v4 was installed, but `globals.css` used v3 directives and never imported the v4 theme.
The compiled CSS had **no spacing scale, no font-size scale, no default palette and zero `md:` variants**,
so most of the layout authored across 20+ files never reached the browser. The visible symptoms were what the
brief described: inconsistent type, collapsed responsive layouts, one-letter-per-line names, invisible
checkboxes, and a growing pile of one-off CSS written to route around the missing utilities.

*Heuristic.* On top of that root cause: every page competed at equal weight, the athlete page repeated the
name/print/technique chips two or three times, athlete creation exposed 14 fields, Quick Capture buried
Save below the fold, and Activity/Badges were invisible for real athletes and decorated with emoji for
sample ones.

## 3. Constraints

- One autonomous run (~one working day) on a single branch, ≈$95 of Fable credits, owner unavailable.
- Preserve every data contract, auth/RLS boundary, privacy rule, offline behaviour, print/QR output and
  the coach auto-assignment algorithm. No migrations, no secrets, no production data.
- No Google Fonts or production Supabase reachable from the sandbox → local font mock and a local
  in-memory Supabase stand-in for verification.

## 4. Audit findings (summary)

See `UX_OVERHAUL_AUDIT.md` for the full inventory. Highlights:

| Area | Finding | Severity |
| --- | --- | --- |
| Foundations | Tailwind theme not loaded; 365 palette literals; 9 emoji components; 3 competing label styles | High |
| Data entry | 14-field athlete form; Quick Capture save off-screen; `alert()`/`confirm()` in 12 places; 0 of 67 labels wired to inputs | High |
| Hierarchy | Athlete page = 1,158 lines with every section as an identical white card | High |
| Activity/Badges | Hidden for real athletes; fabricated tournaments with emoji medals; cyan/royal-blue hex | High |
| Tournament day | Names wrap one letter per line; checkbox renders as a dot; three equal CTAs above content | High |
| A11y | No universal focus ring; div-onClick badges; modals without role/focus management; no reduced motion | Medium |

## 5. Design-system decisions and rejected alternatives

Documented in `DESIGN.md` (§1 brand anchors kept verbatim; §2–5 product rules with rationale). Key calls:

| Decision | Rejected alternative | Why |
| --- | --- | --- |
| Load Tailwind v4 properly and **remap** its palette/type/radius onto SVJ tokens | Keep hand-written CSS per page | One scheme, utilities work as authored, drift impossible |
| Two card tiers: static surface (no hover) vs. interactive (hover/press) | Hover-rise on every card | Hover on static content falsely implies clickability |
| Uppercase reserved for kicker/section labels/buttons; names in sentence case | Uppercase headings everywhere | Word-shape and density on phones |
| Bottom tab bar on phone + inline nav on tablet | Hamburger menu | Thumb reach; one tap fewer per switch |
| Progressive disclosure via native `<details>` | Multi-step wizard | Zero JS, keyboard-accessible, no lost state |
| Sample data in dashed warning bands | Small "sample" tag only | Must be unmistakable in a demo |
| Semantic state tints derived from the scheme | Tailwind red/green/yellow defaults | Stay on-brand, still readable |

## 6. Priority workflows (DFV gate)

Must: foundations → roster & athlete entry → athlete detail/matside → Quick Capture → Tournament day &
assignment → Activity & Badges → verification. Should (done after Must was green): opponents, login,
unauthorized, invite, gallery, print, docs. Cut: animation, badge art, analytics, schema changes,
integrations. See `UX_OVERHAUL_PLAN.md`.

## 7. Before / after evidence

Screenshots: `docs/screenshots/baseline/` vs `docs/screenshots/after/` (same 19 scenes × 3 widths, same
fixtures). Suggested pairs for a portfolio page:

| Scene | Caption |
| --- | --- |
| `athlete--phone` | Matside hierarchy: identity → Today → focus → techniques → intel → development. Name and print appear once. |
| `athlete-capture-filled--phone` | Quick capture with Win + Ippon selected; Save is on screen with the live summary. |
| `roster--desktop` | Search, one primary action, belt marks, "Today · Mat 1" pills, sample tags. |
| `roster-add--phone` | Three fields visible; competition details and techniques disclosed. |
| `tournament-day--phone` | Roster rows with fixed action group; real checkbox cards; sticky Save with unsaved-changes status. |
| `assign-preview--tablet` | Auto-assign preview as an accessible dialog with conflict notices. |
| `athlete-demo--phone` | Sample bands around demo tournament history and badges; captured results above them are real. |
| `design-tokens--desktop` | Token gallery with every primitive specimen. |

## 8. Data-entry friction changes (*measured* by the smoke suite unless noted)

| Workflow | Before (`main`) | After |
| --- | --- | --- |
| Quick capture: Win with Ippon, from tapping "Quick capture" to saved | 5 taps + scroll (open, Win, Unknown, Ippon, scroll, Save; opponent defaulted to "Club list" which cannot save) | **4 taps, no scroll** (open, Win, Ippon, Save); bare result = 2 taps |
| Save button visible when Quick capture opens (390px) | No | **Yes** |
| Fields visible when "Add athlete" opens | 14 | **3** (first name, initial, belt); rest disclosed |
| Athlete create: Save reachable without scrolling (390px) | No (~2,000px form) | **Yes** (sticky) |
| Inline validation | none (`required` only; server errors written into Notes field) | field-level errors + focus to first error + `Notice` |
| `alert()` / `confirm()` | 12 | 0 in app UI (1 remains in the service-worker update prompt) |
| Labels wired to inputs (`htmlFor`) | 0 / 67 | all fields via `Field` |

## 9. Safe-refactoring decisions

- `app/athletes/[id]/page.tsx`: 1,158 → 313 lines; presentation extracted into nine components under
  `components/athlete/`. Data calls and their payloads are byte-for-byte the same shapes (asserted by tests
  on `athleteFormToPayload` and by the smoke suite's write-log checks).
- Pure logic extracted first, with tests: `lib/athlete-form.ts`, `lib/development.ts`. Existing tests
  (`capture-score`, `meta-row`, `technique-chips`, picker CSS guards) still pass.
- `useCoachGate()` replaces six copied auth-redirect effects with identical behaviour.
- Untouched on purpose (*measured*: empty diff vs `main`): `lib/supabase-store.ts`, `lib/quick-capture.ts`,
  `lib/coach-auto-assign.ts`, `lib/auth-context.tsx`, `lib/auth-utils.ts`, `public/sw.js`,
  `app/sw-register.tsx`, `supabase/`.
- Dependencies added: `tsx` (test runner) and `playwright` (smoke/screenshots), both dev-only.

## 10. Privacy and technical guardrails

- First name + last initial enforced in both athlete and opponent forms (`normalizeLastInitial`), and the
  smoke suite asserts no full surname is rendered or written.
- No photos: no `<img>` on athlete pages except the header logo.
- Opt-out cascade delete: same preview + typed-name confirmation, now in an accessible dialog.
- Auth boundaries: the verification harness mocks the network *outside* the app (Playwright routes); the
  app still performs its real login and allowlist checks against the mock. No auth code changed.
- Offline/PWA: service worker and registration untouched; the offline banner and cache button are restyled only.
- Print/QR: print routes render with the header/bottom nav hidden; QR unchanged.

## 11. Verification evidence (*measured*)

| Check | Result |
| --- | --- |
| `npm run build` | ✅ 13 routes (with the sandbox font mock; fonts are fetched normally on Vercel) |
| `npm test` | ✅ 23/23 (17 existing + 6 new) |
| `npm run smoke` | ✅ 116/116 — auth gate, overflow at 3 widths, one `h1` per route, 44px touch floor, console errors, Quick Capture write shape and tap count, athlete create shape and validation, tournament-day save and auto-assign PATCH shape (locked/exclusive coaches honoured), keyboard focus ring, dialog Escape + focus return, sample seeding, privacy |
| Screenshots | ✅ 57/57 scenes, 0 horizontal overflow, 0 console errors |
| Compiled CSS | `md:` variants 0 → 14 distinct; palette utilities now resolve to SVJ tokens |
| Emoji in UI | 9 files → 0 |
| Hex literals in components | 10 → 0 (theme-color meta only) |
| Secrets / production data | none; `.env.local` is placeholder-only and git-ignored |

## 12. Known limitations

- Print pages are consistent but not rebuilt on the primitives.
- Palette utility classes still appear in the two print pages (81 occurrences, all resolving to tokens).
- The badge system and sample tournament history remain mock-only; real athletes see captured results only.
- The `ensureMockDemoData` behaviour (auto-creating "Demo A" and "Sample B") is preserved, so a truly empty
  roster is not reachable in the UI; the empty state exists and is exercised by search-with-no-results.
- Baseline screenshots were taken with the broken CSS, so they show what coaches would have seen, not what
  the previous author intended.
- Fonts are mocked in the sandbox; visual review of the real Michroma/Archivo/Source Sans rendering happens
  on the Vercel preview.

## 13. Assumptions still requiring coach testing (*hypotheses*)

Listed in `UX_OVERHAUL_REVIEW.md` → Questions: section order matside, "Unknown opponent" default, the three
bottom tabs, whether the score sequence is wanted, belt-history placement, print-pack format.

## 14. Recommended first usability test

Five coaches, one phone each, at a training session (not a tournament), 20 minutes:
1. "Find Maya's development focus and her go-to throw." (time to first correct answer)
2. "She just won by ippon with seoi-nage against someone you don't know. Log it." (taps, errors, whether
   they open "Add detail")
3. "Add a new white belt named Aiko N." (do they open any disclosure? do they look for more fields?)
4. "Mark who is competing Saturday and give Priya to Coach Amy on mat 1." (do they find Save? Assign?)
5. "Show me what this athlete has done this season." (do they understand sample vs. real?)
Record task success, taps vs. the measured minimums above, and where they hesitate. Decide question 1–6
in the review doc from that session before release.

## 15. Suggested portfolio screenshots and captions

See §7. Pair each `after` image with its `baseline` counterpart at the same width; lead with
`athlete--phone` and `athlete-capture-filled--phone`.
