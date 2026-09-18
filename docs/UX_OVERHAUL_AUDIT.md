# UX Overhaul Audit — Silicon Valley Judo Competitor Analysis

Branch: `fable/portfolio-ux-overhaul` · Baseline: `main` @ `3cf7c63` (PR #37) · Date: 2026-09-18

This audit is an **expert heuristic review** performed before any redesign work. The product has not been
released to coaches or families, so nothing here is a validated user outcome. Every usability conclusion is a
hypothesis to test with coaches later (see `PORTFOLIO_CASE_STUDY.md` → "Recommended first usability test").

---

## 1. Baseline verification (before any code change)

| Check | Result | Notes |
| --- | --- | --- |
| `npm ci` | ✅ | Node 22.22, npm 10.9 |
| `npm run build` (as-is) | ❌ | Fails in this sandbox only: `next/font` cannot reach Google Fonts (proxy 403). Not a code defect. |
| `npm run build` with font mock + placeholder env | ✅ | `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` + a local `.env.local` with placeholder public values. 13 routes compile. |
| Existing tests (`node --test`) | ❌ 2 / 7 files | Extensionless TS imports do not resolve under plain `node --test`. |
| Existing tests via `tsx --test` | ✅ 17 / 17 | `tsx` added as a devDependency and wired to `npm test`. |
| Lint | n/a | `eslint.ignoreDuringBuilds: true`; no ESLint config in repo. |

Baseline screenshots: `docs/screenshots/baseline/<scene>--<phone|tablet|desktop>.jpg` (19 scenes × 3 widths),
captured by `scripts/ui-smoke/screenshots.mjs` against local demo fixtures (see §6). No production credentials
were used or needed.

### 1.1 Root-cause finding: the Tailwind theme is not loaded

`app/globals.css` starts with the Tailwind **v3** directives (`@tailwind base; @tailwind components; @tailwind
utilities;`) plus `@config`, but the project runs Tailwind **v4.3**. In v4 the default theme is only loaded via
`@import "tailwindcss"` (or `tailwindcss/theme.css`). Because neither is imported, the compiled CSS contains
**no spacing scale, no font-size scale, no default palette and no breakpoints**:

| Utility family used in TSX | Emitted in build CSS? |
| --- | --- |
| `p-4`, `px-4`, `mb-2`, `mt-1`, `gap-4`, `space-y-*` | ❌ |
| `text-xs` … `text-3xl`, `font-bold`, `tracking-wide`, `leading-relaxed` | ❌ |
| `text-gray-*`, `bg-gray-50`, `bg-blue-50`, `text-red-*` (365 occurrences) | ❌ |
| `w-8`, `h-8`, `max-w-5xl`, `max-h-40`, `rounded-lg`, `sticky`, `top-20` | ❌ |
| every `md:` / `lg:` responsive variant | ❌ (0 emitted) |
| `flex`, `grid-cols-*`, `uppercase`, `text-center`, `w-full`, `text-svj-*` (from `@config` extend) | ✅ |

Consequence: a large share of the authored layout never reaches the browser. Headings fall back to browser
default sizes and margins, phone/desktop layouts collapse into the same layout, and previous fixes were done by
adding bespoke classes to `globals.css` (`.assign-actions`, `.card-grid`, `.page-title-row` …) with the comment
"Tailwind md: utilities are not emitted". This is the single largest driver of the "inconsistent fonts, sizing,
spacing, density, and responsive behavior" risk, and it is fixed at the foundation level in Phase 4.1.

---

## 2. Route and component inventory

### 2.1 Routes

| Route | Purpose | Auth gate | Shell | Size | Notes |
| --- | --- | --- | --- | --- | --- |
| `/login` | Email/password + magic link | public | none (navy field) | 222 L | Labels not associated with inputs. |
| `/unauthorized` | Not on allowlist | signed-in | none | 56 L | |
| `/` | Roster + inline "Add athlete" form | coach | AppHeader | 426 L | 14-field form; no search; equal-weight cards. |
| `/athletes/[id]` | Athlete detail + edit + notes + promotions + activity + badges + quick capture + delete | coach (delete admin) | AppHeader(back) | **1158 L** | Largest file; matside card duplicates the profile card. |
| `/athletes/[id]/print` | Printable matside card + QR | coach | none | 250 L | |
| `/opponents` | Shared opponents CRUD | coach | AppHeader | 504 L | |
| `/tournament-day` | Pick today's competitors, print pack, offline sync | coach | AppHeader | 349 L | Explicit "Save Selection"; hidden checkbox (see §3). |
| `/tournament-day/assign` | Coach/mat/time board + auto-assign preview | coach | AppHeader(back) | 723 L | |
| `/tournament-day/print` | Multi-athlete print pack | coach | none | 230 L | |
| `/invite` | Coach allowlist + custom techniques | admin | AppHeader(back) | 313 L | |
| `/admin/design-tokens` | Token gallery | admin | AppHeader(back) | 71 L | |

Every gated route re-implements the same `useEffect` auth redirect block (6 copies).

### 2.2 Shared components

| Component | Role | Findings |
| --- | --- | --- |
| `AppHeader` | Sticky navy header, nav, sign out | Nav is a "Menu" button that toggles a stack of pill buttons; on phone the header is ~120px tall before content. Back-link mode hides navigation entirely. |
| `ui/Button`, `ui/Card`, `ui/Chip`, `ui/MetaRow` | Primitives | Good seeds. `Card` hover raises shadow on non-interactive cards too. |
| `MatSideCoachCard` | 30-second card | Repeats name/belt/print/quick-capture that also appear in the profile card directly beneath. |
| `QuickCapture` | Post-match capture | Result → opponent (3 modes) → score sequence → technique → how → note. Minimum path is 2 taps (Result + Save) but the form is 3 screens tall on a phone and the save button is off-screen. |
| `TechniquePicker` | Search + chips | Solid; results panel in-flow; a11y: no `aria-activedescendant`, results are buttons inside a `listbox`. |
| `TechniqueDisplay` | Resolved chips | Uses `bg-blue-50 border-blue-200` (not emitted → unstyled boxes in baseline). |
| `ActivitySection`, `TournamentCard`, `MatchRow`, `MatchDetail`, `CareerTimeline` | Mock activity | Only render for "Demo A" / "Sample B"; **real athletes get no Activity section at all** (component returns `null`). Emoji medals, off-brand green/red/orange. |
| `BadgesSection` | 34-badge grid + modal | Cyan progress ring / hard-coded hex tier colors; non-keyboard `div onClick`; modal without `role="dialog"`; only mock counts. |
| `MockDataBadge` | "🏷️ Sample Data" | Emoji, yellow palette not in the system. |
| `OptOutDeleteModal` | Admin cascade delete | Correct flow; ad-hoc modal styling; emoji warning. |
| `offline-banner`, `sync-button` | PWA | Emoji, yellow/green/red literal colors. |
| `admin/DesignTokensGallery` | Token gallery | Fine. |

### 2.3 Global styles and state

- `app/globals.css` (1051 lines): tokens (good), aliases, `.card`, `.btn-*`, header, technique picker, plus a
  growing set of page-specific layout classes that exist only because Tailwind responsive utilities were missing.
- State: `auth-context` (user, allowlist, admin), `online-context` (online, cache), per-page `useState` forms.
- Data: `lib/supabase-store.ts` (1757 lines) — untouched by this overhaul except for read-only usage.

---

## 3. Findings by risk area (heuristic)

Severity: **H** blocks a core job · **M** slows/confuses · **L** polish.

### 3.1 Data-entry friction
| # | Sev | Finding | Evidence |
| --- | --- | --- | --- |
| F1 | H | Athlete creation shows all 14 fields at once (2 required). Two technique pickers, four free-text notes, weight, division, stance, belt. | `app/page.tsx` L152–370; baseline `roster-add--phone` is ~2,400px tall. |
| F2 | H | Quick Capture: save button is below the fold on phone; result chips, opponent modes, score sequence, technique picker, "How", "Note" all compete at equal weight. No visible save confirmation after `onSaved` (form just disappears). | `athlete-capture--phone`. |
| F3 | M | Quick Capture is rendered *below* the matside card, so tapping "Quick capture" on a phone scrolls the user 1,000px down before the form is visible. | `athlete-capture--phone`. |
| F4 | M | Errors are surfaced via `alert()`/`console.error`; athlete create writes the error into the Notes textarea. | `app/page.tsx` L104. |
| F5 | M | Edit mode replaces the whole profile with a 15-field form; Preferred-coach checkboxes use emoji labels. | `athletes/[id]/page.tsx` L379–645. |
| F6 | L | `<label>` elements are not associated with inputs anywhere (0 × `htmlFor`, 67 labels) → tapping a label does nothing, screen readers announce unlabeled fields. | grep. |

### 3.2 Activity and Badges
| # | Sev | Finding |
| --- | --- | --- |
| A1 | H | Both sections are invisible for real athletes (return `null`), so the feature reads as absent rather than empty. Captured Quick Capture results (win/loss, ippon, shido…) are never surfaced in Activity. |
| A2 | H | For demo athletes, Activity shows fabricated tournaments with emoji medals and a "🏷️ Sample Data" tag that looks like a decoration, not a warning. |
| A3 | M | 34 badges at equal size, 40% opacity when locked, cyan/royal-blue/saddle-brown hard-coded colors; modal is not keyboard reachable. |
| A4 | M | Career timeline uses a horizontal scroll with 100px hard-coded connectors. |

### 3.3 Navigation and hierarchy
| # | Sev | Finding |
| --- | --- | --- |
| N1 | H | Athlete page: matside card, profile card, promotions, activity, badges and opponent notes are all identical white cards with identical `h3` headings. The name, belt, print button and technique chips each appear two or three times. |
| N2 | M | Header: phone nav requires a "Menu" tap; on detail pages navigation disappears entirely (back link only). No bottom navigation for thumb reach. |
| N3 | M | Tournament Day: three equal-weight buttons ("Save Selection", "Print All", "Assign Coaches") before any roster is visible; selection needs an explicit save. |
| N4 | M | Tournament Day roster rows wrap athlete names one character per line at 390px (flex row without `min-width: 0`), and the selection checkbox renders as a 2px dot because `w-8 h-8` is not emitted. Baseline `tournament-day--phone`. |
| N5 | L | Page titles are `h2` with no `h1`; eyebrow + title + subtitle pattern is repeated inline on every page with slightly different classes. |

### 3.4 Visual consistency
| # | Sev | Finding |
| --- | --- | --- |
| V1 | H | Tailwind theme not loaded (see §1.1). |
| V2 | M | 365 Tailwind palette literals (`text-gray-*`, `bg-blue-50`, `text-red-*`…) outside the SVJ scheme; 10 hex literals in `BadgesSection`. |
| V3 | M | Emoji in 9 components (🏷️ 📱 ⚠️ 🥇 ⏱️ 🔒 ⭐ ⟳ ✓ ✗), contradicting DESIGN.md "Emoji: never". |
| V4 | M | Three uppercase/tracked label styles (`.eyebrow` 13px .22em blue, `.form-label` 11px gray, `.meta-row-label` 13px gray) used interchangeably as form labels, section headings and metadata keys. |
| V5 | L | Two radius systems: tokens (0/2/4/8/pill) and Tailwind (`rounded-lg`, `rounded-md`, `rounded`). |
| V6 | L | Native `confirm()`/`alert()` in 12 places. |

### 3.5 Accessibility
| # | Sev | Finding |
| --- | --- | --- |
| X1 | H | Unlabeled inputs (F6). |
| X2 | M | Focus visibility only defined on `.form-input`, `.chip-toggle`, `.list-choice`, `.technique-picker-option`; buttons and links rely on the browser default, which is suppressed by the `outline` reset in some browsers. |
| X3 | M | Badge tiles are `div onClick`; badge/delete modals lack `role="dialog"`, focus trap and Escape handling (assign preview has `role` but no focus management). |
| X4 | M | No `prefers-reduced-motion` handling; `hover:scale-105` on badges. |
| X5 | L | Tournament-day selection cards are clickable `div`s with no `role="checkbox"`/`aria-checked`. |
| X6 | L | Colour-only result cues in `MatchRow` (green/red backgrounds with ✓/✗). |

### 3.6 Maintainability
| # | Sev | Finding |
| --- | --- | --- |
| M1 | H | `athletes/[id]/page.tsx` at 1,158 lines holds four forms, three lists and a modal. |
| M2 | M | Auth-redirect effect duplicated in 6 pages; page header block duplicated in 8 pages; loading screen duplicated in 9 pages. |
| M3 | M | Belt/stance/weight/division "meta grid" implemented four different ways. |
| M4 | L | 25 status/verification markdown files at repo root from earlier runs. Left untouched (out of scope) but noted for a later cleanup. |

---

## 4. DESIGN.md assessment — Keep / Change / Remove / Add

DESIGN.md was written from the marketing site (`svjudo.com`) and later patched with an "APP OVERRIDE" paragraph.
The two halves conflict (soft 8px cards + hover-rise vs. thick borders + offset shadows). The assessment below
separates **brand anchors** (kept verbatim) from **product-interface rules** (revised with rationale).

### Keep (brand anchors)
| Rule | Why |
| --- | --- |
| One blue (`#005e9b`) on a field of navy; no secondary hue, no warm accent, no multi-hue gradients | Recognisable SVJ identity; also keeps the UI calm for matside scanning. |
| Radial navy field for full-bleed dark surfaces (login, loading) | Signature background; used only on non-operational screens. |
| Michroma wordmark, Archivo headings, Source Sans 3 body | Brand typography. Weights trimmed (see Change). |
| Pill buttons, uppercase, tracked | Distinctive and already 44px tall. Tracking reduced on `sm`. |
| Navy-tinted shadows only, never neutral black | Cheap consistency win. |
| Emoji: never; Lucide-style 2px glyphs if a glyph is needed | Enforced now (baseline violated it 9×). |
| Hover darkens, never lightens; opacity only for disabled | Keep. |
| Sticky navy header | Keep, but slimmer on phone (see Change). |

### Change (product-interface rules)
| Current rule | Revision | Rationale |
| --- | --- | --- |
| Cards: 8px radius, 1px hairline, soft shadow, **rise on hover**; *plus* app override: 2–3px border + `4px 4px 0` offset shadow everywhere | Two card tiers. **Surface** (`.card`): 2px navy border, 8px radius, `2px 2px 0` offset, *no hover change*. **Interactive** (`.card-link`, selected states): the same, and the neo offset grows/colour shifts only when the card itself is the control. Nested sub-panels use paper background with a 1px hairline, never a second neo border. | Hover-rise on non-clickable cards falsely implies clickability (Norman: affordance). Stacking offset shadows on every nested block makes matside pages visually loud; reserving the neo treatment for hierarchy (page-level cards, primary actions) keeps the Gumroad/PostHog feel with less noise. |
| Headings: Archivo Bold, uppercase, .04em, `--fs-h2` 26–38px | Uppercase is reserved for **page titles and section eyebrows**. Athlete names, card titles and dialog titles are Archivo Bold in **sentence case, 0 tracking**. Scale for the app: 28/22/18/16 (h1–h4) instead of the marketing clamp. | Uppercase tracked text at 13–18px reduces word-shape recognition and costs ~15% width; matside lists are name-dense. Names like "Maya H." read better in mixed case. |
| Eyebrow 13px .22em blue "above nearly every heading" | Eyebrow appears **once per page** (page kicker). Section headings use a new `SectionHeading` primitive: 13px Archivo Semibold, .08em, gray-600. Form labels are 14px Source Sans Semibold, sentence case, gray-800. | Baseline used the marketing eyebrow as the form-label style, so labels, metadata and headings were indistinguishable. Distinct roles need distinct styles. |
| Body 17 / 1.62 | App body **16 / 1.5**; small **14 / 1.45**; caption **13 / 1.4**. | 17/1.62 is a long-form reading measure. Operational screens need density; 16px still avoids iOS input zoom. |
| Tracking `--ls-button` .12em on all buttons | .08em on `md`, .06em on `sm`. | Long labels ("Auto-assign coaches") wrapped on phone at .12em. |
| Spacing: `--section-y` 96/64, `--gutter` 24, container 1200 | App page padding: 16px gutter on phone, 24px tablet+, page max width 1200 for lists and boards, **720px for focused forms** (`.page-shell--narrow`). Section rhythm 24/32, never 64/96. | Marketing section rhythm wastes matside screen height; a fixed centred column is right for forms but boards benefit from the full width. |
| Radius: 0 default, 2px controls, 4px inputs, 8px cards, pill buttons/badges | Same values, but codified as the **only** allowed radii; Tailwind `rounded-*` is remapped to these tokens so `rounded-lg` cannot introduce 12px. | Prevents drift. |
| Header 76px, always navy | 56px on phone, 64px tablet+, navy. Nav becomes a persistent **bottom tab bar on phone** (Roster · Opponents · Today) and inline links on tablet+. | Thumb-reachable navigation for one-handed matside use; frees ~60px of viewport. |
| Motion: 120/200/420ms, fades and 2px translations | Same, plus `prefers-reduced-motion: reduce` collapses all transitions to 0ms. | Accessibility gap. |
| Fonts: Michroma 400, Archivo 600/700, Source Sans 3 400/600 | Michroma is only used on login/unauthorized wordmark. Keep but load `display: swap` with `adjustFontFallback` (default) and document the cost (~25–35 KB per family, ~100 KB total). Not removed: the wordmark is a brand anchor. | Cost is acceptable for a PWA that caches assets; documented so a future agent doesn't add a fourth family. |

### Remove
| Rule | Why |
| --- | --- |
| Marketing-only tokens as *defaults*: `--shadow-card`/`--shadow-raised` hover-rise, `--section-y`, `--measure`, `--scrim-photo`, `--blur-panel` frosted-modal note | Kept as tokens in the gallery for future marketing surfaces, but removed from the app rules so they cannot be reintroduced as app defaults. |
| "Nav items grow a 2px blue underline" | The app nav is pill/tab based; the underline rule was never implemented. |
| Duda/Mindbody notes | Irrelevant to the app; moved to a one-line provenance note. |

### Add (missing standards)
Inputs & selects · search fields · validation and error text · loading, empty and error states · dialogs (role,
focus, Escape, scrim) · toasts/inline confirmations · lists and tables (row anatomy, dense meta rows) ·
navigation (bottom tab bar, back affordance, page-title anatomy) · bottom sticky actions with safe-area insets ·
touch targets (44px floor, 48px primary) · focus ring (2px blue, 2px offset, on every interactive element) ·
contrast floor (4.5:1 text, 3:1 UI) · reduced motion · semantic structure (one `h1` per page) · information
density tiers ("matside", "default") · responsive breakpoints (≥768 tablet, ≥1024 desktop) · semantic state
colours (success/warning/danger tints derived from the scheme, not Tailwind defaults) · sample-data marking.

All of these are written into the revised `DESIGN.md` §3 "Product interface rules".

---

## 5. DFV scope gate

| Item | Desirability | Feasibility | Viability | Class |
| --- | --- | --- | --- | --- |
| Load the Tailwind theme, remap palette/radius to SVJ tokens, reduced-motion, focus ring | Fixes V1/V2/X2/X4 everywhere | Foundation-level CSS only | Removes the reason for one-off CSS | **Must** |
| Slim AppHeader + phone bottom tab bar | N2 | Component + CSS | Shared shell | **Must** |
| `PageShell`/`PageHeader`/`SectionHeading`/`Field`/`EmptyState`/`Notice`/`Dialog` primitives | Consistency, a11y | Small components | Replaces 8 duplicated blocks | **Must** |
| Roster: search, primary action, progressive-disclosure athlete form (`AthleteForm`) | F1, F4, F6 | Same `createAthlete` contract | Shared with edit | **Must** |
| Athlete detail: hierarchy (identity → today → focus → techniques → opponents → activity → admin), extract sections | N1, M1 | Presentational split only | Maintainable | **Must** |
| Quick Capture: sheet at top, sticky save, minimum path, advanced disclosure, confirmation | F2, F3 | Same `saveQuickCapture` | Core job | **Must** |
| Tournament Day + Assign: fix N3/N4, next-action clarity, `RosterRow` | N3, N4 | CSS + component | Preserves auto-assign logic | **Must** |
| Activity + Badges: one "Development" story, surface captured results (no schema change), clear sample/empty/earned/locked states | A1–A4 | Reads existing `opponent_notes` capture fields | Uses existing adapters | **Must** |
| Verification: build, tests, smoke suite, screenshots | — | Harness built in Phase 1 | Repeatable | **Must** |
| Opponents, Invite, Login, Unauthorized, Design tokens, Print consistency | V2/V3 on secondary routes | Mostly class swaps | Consistency | **Should** |
| Docs: DESIGN.md rewrite, plan, review, case study | Portfolio | Writing | Governance | **Should** |
| Toast system, animation polish, new badge art, analytics, activity schema, SmoothComp | — | Out of run budget or explicitly out of scope | — | **Could → cut** |

Cut list (not started): decorative animation, badge artwork, analytics, data-model changes, integrations,
root-level markdown cleanup.

---

## 6. Verification harness added in Phase 1

- `scripts/ui-smoke/supabase-mock.mjs` — in-memory PostgREST/GoTrue stand-in attached with Playwright
  `page.route()`. The app code and its auth checks are untouched; the browser performs the real login flow
  against the mocked token endpoint and the mock answers only the REST shapes `lib/supabase-store.ts` issues.
- `scripts/ui-smoke/fixtures.mjs` — six demo athletes (rich, sparse, two sample-data athletes), three shared
  opponents, captured results, promotions, a tournament day with entries, and the seeded Kodokan technique list.
  Privacy rules hold: first name + last initial only.
- `scripts/ui-smoke/screenshots.mjs` — 19 scenes × 390/768/1440.
- `scripts/ui-smoke/smoke.mjs` — assertions (added in Phase 4): no horizontal overflow, no console errors,
  touch-target floor, Quick Capture write shape, athlete create shape, assignment update shape, print/offline
  routes render.
- `npm test` runs the unit tests with `tsx --test`; `npm run smoke` runs the browser suite against a running server.
