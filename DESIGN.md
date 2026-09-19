# Silicon Valley Judo — DESIGN.md

Design system for the **Silicon Valley Judo Competitor Analysis** app (coach-facing, phone-first, used
matside). Revised on the `fable/portfolio-ux-overhaul` branch after the audit in
`docs/UX_OVERHAUL_AUDIT.md`. Two kinds of rules live here:

- **§1 Brand anchors** — fixed. Derived from `svjudo.com`; do not revise without the club's say-so.
- **§2–§4 Product-interface rules** — revisable. Each rule states *why*, so a future change replaces the
  reason, not just the value.

Source of truth for values: CSS custom properties on `:root` in `app/globals.css` (`--svj-*`). Tailwind v4 is
loaded with `@import "tailwindcss"`, and the `@theme` block remaps Tailwind's default palette, type scale and
radii onto the SVJ tokens — so `text-gray-600`, `text-sm`, `rounded-lg`, `md:` all resolve to system values.
**Do not add hex, font or radius literals in components; use a token or a primitive.**

---

## 1. Brand anchors (fixed)

| Anchor | Value | Notes |
| --- | --- | --- |
| Brand blue | `--svj-blue-600 #005e9b` (hover `700 #00497a`, belt-diagram `500 #0071bc`) | The only accent hue. |
| Navy field | `--svj-navy-900/800/700` on a **radial** gradient (`--svj-gradient-navy-field`) | Used on login, unauthorized and full-screen loading only. |
| Neutrals | white · paper `#f5f7f9` · gray 100–800 | Extended with 300/500/700 steps for UI states. |
| No second hue, no warm accent, no multi-hue gradients | — | Semantic state tints (§2.2) are desaturated and never used decoratively. |
| Typography | Michroma (wordmark only) · Archivo 600/700 (headings, buttons, labels) · Source Sans 3 400/600 (body) | Loaded via `next/font` with `display: swap`. ~100 KB total; cached by the PWA. Do not add a fourth family. |
| Pill buttons, uppercase, tracked | — | Tracking reduced to .08em (md) / .06em (sm) for phone width. |
| Navy-tinted shadows only | — | The app uses flat offset ("neo") shadows; soft marketing shadows remain as tokens. |
| Sticky navy header | — | 56px phone / 64px tablet+. |
| Emoji: never | — | Glyphs are inline SVG, 2px stroke, 24px grid (`components/ui/Icons.tsx`). |
| Wordmark | `.wordmark` Michroma, uppercase, .14em | Login and unauthorized only. |
| Belt colours | `--svj-belt-*` | Rank swatches (`BeltMark`), never UI accents. |

---

## 2. Foundations (product rules)

### 2.1 Type
| Role | Spec | Class / primitive | Why |
| --- | --- | --- | --- |
| Page title (`h1`, once per page) | Archivo 700, 28px/1.15, sentence case, 0 tracking | `.page-title` via `PageHeader` | One `h1` per page for structure; sentence case for names like "Maya H." |
| Card title | Archivo 700, 22px | `.card-title` | |
| Sub-title | Archivo 700, 18px | `.card-title-sm` | |
| Page kicker | Archivo 600, 13px, uppercase, .18em, brand blue | `.page-kicker` / `.eyebrow` | The marketing "eyebrow", used **once** per page. |
| Section heading | Archivo 600, 13px, uppercase, .08em, gray-600 | `SectionHeading` | Distinct from the kicker so section labels never compete with the title. |
| Meta key | Archivo 600, 11px, uppercase, .08em, gray-600 | `.meta-key`, `MetaRow` | Key/value facts ("Stance: Right"). |
| Form label | Source Sans 600, 14px, sentence case, navy | `Field` | Labels are read, not scanned; sentence case is faster at 14px. |
| Body | Source Sans 400, 16px/1.5 | default | 16px avoids iOS zoom on inputs and reads at arm's length. |
| Small / caption | 14px/1.45 · 13px/1.4 | `text-sm`, `text-xs` | |
| Uppercase | Kicker, section heading, meta key, buttons, chips, pills only | — | Uppercase costs ~15% width and word-shape; reserved for labels. |

Tailwind aliases: `text-xs` 13 · `text-sm` 14 · `text-base` 16 · `text-lg` 18 · `text-xl` 22 · `text-2xl` 28 · `text-3xl` 32.

### 2.2 Colour
- Text: `--svj-text-strong` (navy-900) for titles and values, `--svj-text-body` (gray-800) for prose,
  `--svj-text-muted` (gray-600) for hints. Contrast ≥ 4.5:1 on white and paper.
- Surfaces: page = paper; cards = white; sub-panels (`.panel`) = paper with a hairline.
- Semantic state (app-only, not brand): `--svj-success` `#2f7d4a`, `--svj-warning` `#9a6b00`,
  `--svj-danger` `#b42318`, each with 50/100/200 tints. Tailwind `green/yellow/red/orange-*` map onto these.
  Use them for results (W/L), notices and destructive controls only.
- Sample data: warning tint + dashed border (`SampleDataTag`, `SampleBand`). Never shown without a label.

### 2.3 Spacing and layout
- 4px base (`--svj-space-1…10` = 4/8/12/16/24/32/48/64/96/128). Section rhythm inside pages: 16 (phone) / 24 (tablet+); between cards: 16 / 24. Never 64/96 in the app.
- Gutters: 16px phone, 24px tablet+. Page max width 1200 (`.page-shell`); focused forms 720
  (`.page-shell--narrow`). Boards and lists use the full width, forms do not.
- Breakpoints: 640 (`sm`, form grids), 768 (`md`, header nav, two-column grids), 1024 (`lg`, three columns).
- Safe areas: `.page-shell` and `.has-bottom-chrome` reserve the phone bottom nav + `env(safe-area-inset-bottom)`.

### 2.4 Radius, borders, elevation
- Radii: 0 · 2px controls · 4px inputs/tags · 8px cards/panels/dialogs · pill for buttons, chips, pills.
  Tailwind `rounded-*` are remapped so nothing else can appear.
- Borders: 1px hairline (gray-100/200) for dividers and sub-panels; 2px navy for cards, buttons, inputs,
  chips; 2px brand blue for the active sheet; 2px dashed for empty states and sample bands.
- Elevation ("neo" offset shadow, navy): `--svj-shadow-neo-sm` 2px for buttons, `--svj-shadow-neo` 3px for
  cards/sheets/dialogs, `--svj-shadow-neo-hover` 4px **only on interactive cards**. Nested panels have no
  shadow. Soft marketing shadows remain as tokens for the gallery/future marketing surfaces, not app defaults.
- Why: offset shadows on every nested block made pages loud; reserving them for page-level surfaces and
  controls preserves the neo character while restoring hierarchy.

### 2.5 Motion and focus
- Durations 120/200/320ms, `--svj-ease-standard`. Fades, 1–2px translations, chevron rotation only.
- `prefers-reduced-motion: reduce` collapses all transitions and animations.
- Focus: one rule for every interactive element — 2px brand-blue outline, 2px offset (inset on inputs).
  Never remove it.

---

## 3. Components (product rules)

| Component | Primitive | Rules |
| --- | --- | --- |
| Buttons | `Button` (`primary`, `secondary`, `danger`, `ghost`, `ghost-danger`; `sm`/`md`/`lg`; `block`) | 44px min (48px `lg`). One primary per view region. Danger is outlined and only for destructive actions. Ghost for in-card secondary actions. |
| Cards | `Card` (`interactive`, `dark`, `selected`) | Plain cards never change on hover. `interactive` (or `as={Link}`) enables hover/press. Selected = blue border + blue-50 fill + blue offset. |
| Sub-panel | `.panel` | Paper + hairline, no shadow. For forms-in-cards, lists of proposals, score sequences. |
| Sheet | `.sheet` | In-flow form with a brand-blue 2px border: quick capture, add/edit forms. Opens near the top of the page and scrolls into view. |
| Fields | `Field` + `.form-input` | Label wired with `htmlFor`; `aria-describedby` for hint/error; `aria-invalid`; 44px min height; 2px gray-300 border, blue on focus; selects have a drawn chevron. Required marked with `*`, optional with "optional". |
| Search | `.search-field` + `.form-input--search` | Magnifier glyph; `type="search"`; visually-hidden label. |
| Progressive disclosure | `Disclosure` (native `<details>`) | Title + hint + chevron; body indented; open by default when it already has content (edit). |
| Chips | `Chip` (`aria-pressed`) | Toggle. Selected = navy fill. `lg` for the primary choice (result). |
| Pills / tags | `Pill` (brand, navy, outline, success, warning, danger, muted) · `Tag` | Pills are status labels, uppercase. Tags are sentence-case technique names on blue-50. Neither is a control. |
| Notices | `Notice` (info, success, warning, danger, muted) | Inline, with glyph. `role="alert"` for errors, `status` for saves. Replaces `alert()`. |
| Empty states | `EmptyState` | Dashed border, title, one line of guidance, the next action. A section that could have data must show one, never render nothing. |
| Loading | `LoadingScreen` (full page, navy) · `LoadingBlock` (inline) · `.skeleton` | Label what is loading. |
| Dialog | `Dialog`, `ConfirmDialog` | `role="dialog"`, `aria-modal`, labelled by title, Escape closes, focus moves in and returns to the opener, Tab wraps. Bottom sheet < 640px, centred panel above. Replaces `confirm()`. |
| Sticky actions | `StickyActions` | Bottom-pinned Save/Cancel with a status line; sits above the bottom nav and the home indicator. |
| Stat tiles | `StatTile` (`accent`, `warning`) | Label + number; four across from 640px. |
| Meta | `MetaRow` (inline) · `MetaGrid` (dl) · `BeltMark` | Facts, not prose. Empty values are skipped. |
| Lists | `.list-row` | Title + meta + fixed action group; names get `min-width: 0` so they never wrap one letter per line. |
| Results | `.result-badge` W / L / – | Colour **and** letter; never colour alone. |
| Sample data | `SampleDataTag`, `SampleBand` | Illustrative content is banded and captioned. |
| Header | `AppHeader` | Logo + context label; back arrow on detail pages; inline nav from 768px; menu (admin links, sign out). |
| Bottom nav | `BottomNav` | Phone only: Roster · Opponents · Today. `aria-current="page"`. |
| Page header | `PageHeader` | kicker → `h1` → lead → actions. |
| Icons | `Icons.tsx` | Lucide-style inline SVG; decorative glyphs are `aria-hidden`. |

**Density tiers.** Default density is the rules above. Matside surfaces (athlete hero, Today card, Quick
capture) use larger targets (48px chips/buttons) and `StatTile` numbers so they read at arm's length; nothing
else is enlarged.

---

## 4. Accessibility and responsive checklist

- One `h1` per page; sections use `SectionHeading` (`h2`) with `aria-labelledby` on the `section`.
- Every input has a `<label for>`; every icon-only button has `aria-label`.
- Touch targets ≥ 44px (48px for primary matside actions). Verified by `npm run smoke`.
- No horizontal overflow at 390/768/1440 (verified by the smoke suite and screenshot script).
- Colour is never the only cue (W/L badges carry letters; notices carry glyphs and titles).
- Dialogs trap focus and return it. Escape closes any dialog.
- Reduced motion respected. Print hides header, bottom nav, sheets and `.no-print`.

---

## 5. Governance

- Add a token before a value. If a component needs a new colour or size, it is probably a state tint or a
  scale step — add it to `:root` and the `@theme` map, then use it.
- Add a primitive before a pattern. The second time a page repeats a layout (header row, form field, empty
  state), promote it to `components/ui`.
- Demo/sample content must be visibly marked. Real captured data is never mixed into a sample band.
- Gallery: `/admin/design-tokens` renders every token and primitive; check it after changing `globals.css`.
- Verification: `npm run build`, `npm test`, `npm run smoke`, `npm run screenshots` (see
  `docs/UX_OVERHAUL_PLAN.md`).

### Rejected alternatives (recorded so they are not re-proposed)
- **Soft marketing cards with hover-rise everywhere** — implies clickability on static content.
- **Uppercase headings throughout** — hurts name recognition and density on phones.
- **Hamburger-only phone navigation** — one extra tap for every route switch matside; bottom tabs are thumb-reachable.
- **Tailwind default palette alongside `--svj-*`** — two schemes drift; remapping keeps one.
- **A second typeface for numbers / a fourth family** — Archivo tabular numerals are sufficient.
