# Silicon Valley Judo — DESIGN.md

A portable spec of the Silicon Valley Judo (SVJ) design system. Everything here is derived from the
live site `svjudo.com` and its CDN assets. Link `styles.css` to get every token below.

- Brand: Silicon Valley Judo, family judo dojo, Santa Clara CA, est. 2004.
- Surfaces: `svjudo.com` (marketing site, Duda). Booking/sign-in run on Mindbody — SVJ does not
  control that UI; only style the entry points.
- ⚠️ All three typefaces are substitutions (see *Fonts*). Token names will not change when the real
  files arrive.

---

## 1. Tokens

### Color — `tokens/colors.css`

Brand
```
--svj-blue-600 #005e9b   primary brand blue (logomark triangle)
--svj-blue-500 #0071bc   belt-diagram blue
--svj-blue-700 #00497a   hover
--svj-blue-800 #003a61
```
Navy (every dark surface)
```
--svj-navy-900 #0b1e2e   --svj-navy-800 #0f273a
--svj-navy-700 #163e5d   --svj-navy-600 #1d4e72
```
Neutrals
```
--svj-white #ffffff   --svj-paper #f5f7f9   --svj-gray-100 #e8ecef
--svj-gray-200 #ced6dc --svj-gray-400 #8a99a5 --svj-gray-600 #54646f
--svj-gray-800 #2a3742 --svj-black #000000
```
Tatami accents (quiet section washes only)
```
--svj-tatami-red #ffb1a4  --svj-tatami-green #e6e7d9  --svj-tatami-gray #d1c6c2
```
Belt colors: `--svj-belt-{white,yellow,orange,green,blue,purple,brown,black}`.

Semantic aliases
```
--text-strong/-body/-muted/-inverse/-inverse-muted/-link/-link-hover
--surface-page/-alt/-card/-dark/-dark-alt/-brand
--border-subtle/-default/-strong/-on-dark
--action-primary-bg/-hover/-fg, --action-secondary-fg, --focus-ring
```
Signature backgrounds
```
--gradient-navy-field  radial-gradient(120% 130% at 50% 55%, navy-700, navy-800 45%, navy-900)
--scrim-photo          linear-gradient(180deg, transparent, rgba(11,30,46,.35) 45%, rgba(11,30,46,.82))
```

**Rules.** One blue on a field of navy. No secondary brand hue, no warm accent. **No purple-blue or
multi-hue gradients, ever.** The navy field is *radial*, not linear — that is the brand's signature.

### Type — `tokens/typography.css`
```
--font-logo    "Michroma", Eurostile, 'Arial Black', sans-serif   (wordmark only)
--font-heading "Archivo", 'Helvetica Neue', Arial, sans-serif
--font-body    "Source Sans 3", 'Helvetica Neue', Arial, sans-serif
```
Scale: `--fs-display` clamp(40,6vw,84) · `--fs-h1` clamp(32,4vw,56) · `--fs-h2` clamp(26,3vw,38) ·
`--fs-h3` 22 · `--fs-h4` 18 · `--fs-body-lg` 19 · `--fs-body` 17 · `--fs-body-sm` 15 ·
`--fs-caption` / `--fs-eyebrow` 13.

Line height: `--lh-tight` 1.02 · `--lh-heading` 1.12 · `--lh-snug` 1.35 · `--lh-body` 1.62.
Weights: 300/400/500/600/700 as `--fw-*`.
Tracking: `--ls-logo` .14em · `--ls-eyebrow` .22em · `--ls-heading` .04em · `--ls-button` .12em.

**Rules.** Headings are Archivo Bold, uppercase, .04em. The **eyebrow** — 13px Archivo Semibold,
.22em, brand blue, above nearly every heading — is the system's most recognisable typographic move.
Body 17/1.62. Author labels in sentence case and let CSS `text-transform:uppercase` do the work.

### Spacing — `tokens/spacing.css`
4px base, doubling: `--space-1…10` = 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128.
`--section-y` 96 · `--section-y-tight` 64 · `--gutter` 24 · `--container` 1200 ·
`--container-narrow` 820 · `--measure` 66ch · `--header-h` 76px.
Centred fixed-max-width column. Never full-bleed except photography and navy bands.

### Radius & borders — `tokens/radius.css`
`0` default · `2px` small controls · `4px` inputs · `8px` cards and photo frames ·
`999px` pill on buttons and badges (echoes the logomark capsule — the only fully round shape).
Border widths: 1px hairline, 2px capsule, 4px belt-diagram stroke.

### Elevation — `tokens/elevation.css`
Two shadows only, always navy-tinted, never neutral black.
```
--shadow-card   0 1px 2px rgba(11,30,46,.06), 0 8px 24px rgba(11,30,46,.08)
--shadow-raised 0 2px 4px rgba(11,30,46,.08), 0 18px 44px rgba(11,30,46,.14)
```
Plus `--shadow-header`, `--shadow-inset-photo`, `--blur-panel: blur(10px)` (modal backdrop only —
never a frosted header, never blurred cards).

### Motion — `tokens/motion.css`
`--dur-fast` 120ms (control feedback) · `--dur-base` 200ms (color/shadow) · `--dur-slow` 420ms
(panels, max) · `--ease-standard` cubic-bezier(.2,.6,.2,1).
Fades and 2px translations only. No bounce, no spring, no scroll reveal, no parallax, no autoplay
beyond the site's one muted hero video.

---

## 2. Component rules

**Buttons.** Pill, uppercase, tracked. Primary solid blue → `#00497a` on hover. Secondary is a 2px
navy outline that **inverts** to navy fill / white text. On navy the outline is white and inverts to
white fill / navy text. Ghost is a blue text link. Press = `translateY(1px)`; no scale.

**Cards.** White, 8px radius, 1px `#e8ecef` hairline, `--shadow-card`; on hover rise 2px into
`--shadow-raised`. Dark variant (navy fill, translucent white border) as an inset panel on light
sections. **No coloured left borders. No emoji cards.**

**APP OVERRIDE (neo-SVJ hybrid for this product):** For the judo-comp coach app, prefer thick borders (2–3px navy/gray), flat offset shadow (`4px 4px 0` navy-tinted), big clear blocks — Gumroad/PostHog-like — while keeping SVJ colors/type/logo. Marketing soft elevation is NOT the app default.

**Hover.** Links and buttons darken — never lighten, never fade. Nav items grow a 2px blue
underline. Inputs move `#ced6dc` → `#8a99a5`. Opacity only for disabled (0.4).

**Layout furniture.** Header is sticky, always navy, full-width, 76px, never transparent.

**Backgrounds.** Three, alternating: white, cool paper `#f5f7f9`, navy field. No patterns, textures, grain.

**Emoji: never.**

⚠️ If UI glyphs needed (hamburger, chevron), use Lucide at 2px stroke on 24px grid. Prefer typographic characters.

### Fonts (substitutions)
| Role | Substitute |
| Logotype | Michroma |
| Headings, buttons, nav | Archivo Bold/Semibold |
| Body | Source Sans 3 |

---

## App mapping (judo-comp-analysis)

This product consumes the tokens above with **one scheme**. Do not invent a parallel palette.

**Source of truth.** CSS custom properties on `:root` in `app/globals.css`, named `--svj-*`.
Hex values live there (and in this file). Pages and components should use tokens, aliases, or
primitives — not new hex/font literals when a token already covers the job.

**Aliases.** Shipped class names stay: `.card`, `.btn-*`, `.chip-toggle`, `.form-input`,
`.navy-field`, `.eyebrow`, `.wordmark`, `--color-*`, `--font-*`, `--radius-*`, `--shadow-*`.
Those now *map to* `--svj-*` so existing markup picks up the neo skin without a rewrite.

**Fonts.** `next/font` in `app/layout.tsx` owns `--font-logo`, `--font-heading`, and `--font-body`
(Michroma / Archivo / Source Sans 3). `--svj-font-*` aliases those same variables. Do not re-declare
family names in `:root` in a way that overrides the loaded font files.

**Tailwind.** `tailwind.config.ts` `theme.extend` exposes the same tokens as utilities
(`bg-svj-blue-600`, `text-svj-navy-900`, `font-heading`, `shadow-neo`, `rounded-svj-card`,
`p-svj-4`). Default Tailwind spacing (`p-4`, `gap-2`) is unchanged — SVJ space steps are `svj-*`
so we do not smash the built-in scale.

**App UI (neo-SVJ hybrid).** `.card` / `Card` and `.btn-*` / `Button` use 2px navy borders and
`--svj-shadow-neo` (`4px 4px 0` navy-tinted). Marketing `--svj-shadow-card` / `--svj-shadow-raised`
remain as tokens (gallery + future marketing surfaces) but are **not** the app default.

**App-only semantic.** `--svj-danger` is a destructive control color (not a brand hue). Belt purple
is a rank swatch, not a UI accent.

**Primitives.** `components/ui/Card.tsx`, `Button.tsx`, `Chip.tsx` (`Chip` toggle + `Pill` label).
Admin gallery: `/admin/design-tokens`, gated like Invite Coaches (`isAdmin` on the coach allowlist).
