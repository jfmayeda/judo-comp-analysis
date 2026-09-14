# Badge Tier Progression Examples

## Visual Guide to Judo Belt Tiers

### Understanding Progress States

Each badge can be in one of these states:
- **Not Started** (0 count): Grey border, 40% opacity, no progress bar
- **White Belt** (entry tier): White border, full opacity, cyan progress bar showing % to Blue
- **Blue Belt** (developing): Blue border, full opacity, cyan progress bar showing % to Brown
- **Brown Belt** (proficient): Brown border, full opacity, cyan progress bar showing % to Black
- **Black Belt** (mastered): Black border, full opacity, no progress bar (maxed at 100%)

---

## Example: Seoi Star Badge Progression

**Thresholds**: White: 1 | Blue: 5 | Brown: 15 | Black: 40

### Not Started (Count: 0)
```
┌────────────────┐
│   [Seoi Star]  │  ← Grey border
│   (40% opacity)│
│                │
│   Seoi Star    │
└────────────────┘
No progress bar
```

### White Belt (Count: 3)
```
┌────────────────┐
│   [Seoi Star]  │  ← White border
│   (full color) │
│ ▰▰▰▰▰▱▱▱▱▱▱▱▱ │  ← Cyan progress bar (50% to Blue: 3/5)
│   Seoi Star    │
└────────────────┘
Next: Blue at 5
```

### Blue Belt (Count: 10)
```
┌────────────────┐
│   [Seoi Star]  │  ← Blue border
│   (full color) │
│ ▰▰▰▰▰▰▰▰▱▱▱▱▱ │  ← Cyan progress bar (50% to Brown: 10/15)
│   Seoi Star    │
└────────────────┘
Next: Brown at 15
```

### Brown Belt (Count: 25)
```
┌────────────────┐
│   [Seoi Star]  │  ← Brown border
│   (full color) │
│ ▰▰▰▰▰▰▰▰▱▱▱▱▱ │  ← Cyan progress bar (40% to Black: 25/40)
│   Seoi Star    │
└────────────────┘
Next: Black at 40
```

### Black Belt (Count: 45)
```
┌────────────────┐
│   [Seoi Star]  │  ← Black border
│   (full color) │
│                │  ← No progress bar (maxed)
│   Seoi Star    │
└────────────────┘
MAXED at Black
```

---

## Detail Modal: Tier Row

When you tap a badge, the detail modal shows a tier row with all 4 ranks:

### Example: Badge at Brown Tier (Count: 25/40)

```
Progress Ring: [========60%========     ]  25 / 40

Tier Row:
┌──────┐  ┌──────┐  ┌───────────┐  ┌──────┐
│ ⚪   │  │ 🔵   │  │ 🟤 ⭐ 🔔 │  │ ⚫   │
│WHITE │  │ BLUE │  │  BROWN    │  │BLACK │
│  ✓1  │  │  ✓5  │  │  ✓15      │  │ 🔒40 │
└──────┘  └──────┘  └───────────┘  └──────┘
 earned     earned    CURRENT       locked
                     (cyan glow)
```

- **White**: Earned (full color)
- **Blue**: Earned (full color)
- **Brown**: CURRENT (cyan glow + dot indicator)
- **Black**: Locked (40% opacity, greyed out)

---

## Demo Athlete Progress Examples

### Demo A (Extensive Progress)

#### Ippon Machine (22 count) - Brown Belt
- **White** ✓ (needed 1) - Earned
- **Blue** ✓ (needed 5) - Earned
- **Brown** ✓ (needed 15) - Earned, CURRENT
- **Black** 🔒 (needs 40) - Locked, 22/40 progress (55%)

#### Road Warrior (10 count) - Brown Belt
- **White** ✓ (needed 1) - Earned
- **Blue** ✓ (needed 3) - Earned
- **Brown** ✓ (needed 8) - Earned, CURRENT
- **Black** 🔒 (needs 20) - Locked, 10/20 progress (17%)

#### Waza-ari (35 count) - Brown Belt
- **White** ✓ (needed 3) - Earned
- **Blue** ✓ (needed 10) - Earned
- **Brown** ✓ (needed 25) - Earned, CURRENT
- **Black** 🔒 (needs 60) - Locked, 35/60 progress (29%)

### Sample B (Moderate Progress)

#### Seoi Star (2 count) - White Belt
- **White** ✓ (needed 1) - Earned, CURRENT
- **Blue** 🔒 (needs 5) - Locked, 2/5 progress (25%)
- **Brown** 🔒 (needs 15) - Locked
- **Black** 🔒 (needs 40) - Locked

#### Team Spirit (5 count) - Blue Belt
- **White** ✓ (needed 1) - Earned
- **Blue** ✓ (needed 3) - Earned, CURRENT
- **Brown** 🔒 (needs 8) - Locked, 5/8 progress (40%)
- **Black** 🔒 (needs 20) - Locked

#### Road Warrior (2 count) - White Belt
- **White** ✓ (needed 1) - Earned, CURRENT
- **Blue** 🔒 (needs 3) - Locked, 2/3 progress (33%)
- **Brown** 🔒 (needs 8) - Locked
- **Black** 🔒 (needs 20) - Locked

---

## Badge Categories with Example Thresholds

### Technique Badges (Most Common: 1/5/15/40)
- Seoi Star, Ne-waza, Southpaw, Sankaku, Osaekomi, Ashi
- **Philosophy**: Requires consistent execution over time

### Clutch Badges (Easier: 1/3/8/20)
- Golden Score, Comeback Kid, Counter, Escape Artist, Grit
- **Philosophy**: Situational, harder to encounter but achievable

### High-Volume Badges (Harder: 3/10/25/60)
- Iron Grip, Waza-ari
- **Philosophy**: Frequent occurrences, high bar for mastery

### Medal Badges (Quick: 1/2/5/10)
- First Medal, Gold Medal, Full Card (1/2/5/12)
- **Philosophy**: Tournament results, finite opportunities per year

### Specialty Badges (Gradual: 2/4/6/10)
- Tokui Builder
- **Philosophy**: Building a repertoire, not about volume

---

## Progress Bar Visualization

Progress bars use cyan (#06B6D4) and fill from left to right:

### 0% Progress (Just earned current tier)
```
▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱
```

### 25% Progress
```
▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱
```

### 50% Progress
```
▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱
```

### 75% Progress
```
▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱
```

### 100% Progress (About to earn next tier)
```
▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰  → Next tier unlocked!
```

### No Bar (Black Belt - Maxed)
```
(no progress bar shown)
MAXED at Black Belt
```

---

## Color Reference

### Belt Colors (Borders & Tier Row)
```css
--white-belt: #FFFFFF  /* With grey outline for visibility */
--blue-belt:  #4169E1  /* Royal Blue */
--brown-belt: #8B4513  /* Saddle Brown */
--black-belt: #000000  /* Pure Black */
```

### Accent Colors
```css
--progress-bar: #06B6D4  /* Cyan/Teal */
--glow-effect:  rgba(6, 182, 212, 0.5)  /* Cyan 50% opacity */
--locked-opacity: 0.4    /* 40% for unearned/locked */
```

### Status Indicators
```css
--earned-tier:  opacity: 1.0, full belt color
--current-tier: opacity: 1.0, cyan glow + dot
--locked-tier:  opacity: 0.4, greyed out
```

---

## Grid Layout Responsiveness

### Mobile (< 768px): 3 columns
```
┌───┬───┬───┐
│ ⚪ │ 🔵 │ 🟤 │
├───┼───┼───┤
│ ⚫ │ ⚪ │ 🔵 │
├───┼───┼───┤
│ 🟤 │ ⚫ │ ⚪ │
└───┴───┴───┘
```

### Tablet (768-1024px): 4 columns
```
┌───┬───┬───┬───┐
│ ⚪ │ 🔵 │ 🟤 │ ⚫ │
├───┼───┼───┼───┤
│ ⚪ │ 🔵 │ 🟤 │ ⚫ │
└───┴───┴───┴───┘
```

### Desktop (> 1024px): 6 columns
```
┌───┬───┬───┬───┬───┬───┐
│ ⚪ │ 🔵 │ 🟤 │ ⚫ │ ⚪ │ 🔵 │
├───┼───┼───┼───┼───┼───┤
│ 🟤 │ ⚫ │ ⚪ │ 🔵 │ 🟤 │ ⚫ │
└───┴───┴───┴───┴───┴───┘
```

---

## Interaction States

### Default (Not Hovered)
- Scale: 1.0
- Transition: 200ms ease

### Hover
- Scale: 1.05
- Cursor: pointer
- Transition: smooth scale animation

### Clicked (Opening Modal)
- No visual change to badge itself
- Modal fades in with overlay
- Body scroll locked

---

This visual guide helps understand how the tiered badge system progresses through the judo belt ranks, showing athletes their journey from white belt beginner to black belt mastery.
