# Silicon Valley Judo - Competitor Analysis Dashboard

**Premium coach-tool with matside scouting fields and dojo-native design.**

Privacy-first competitor analysis tool for judo coaches. Track athlete development and opponent scouting notes with printable tournament-day profiles. Features comprehensive scouting fields for stance, grip style (kumi-kata), ground game (ne-waza), and tactical analysis.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- A modern web browser with localStorage support

### Installation

```bash
# Clone the repository
git clone https://github.com/jfmayeda/judo-comp-analysis.git
cd judo-comp-analysis

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you'll be taken to the login page. For development, enter any email/password to access the app.

On your first visit after login, the app automatically seeds 3 sample athletes with opponent notes so you can explore the features right away.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎨 Design System

This app follows the **Silicon Valley Judo brand specification** for a premium, dojo-native aesthetic.

### Design Tokens

All design tokens are defined as CSS variables in `app/globals.css`:

**Colors:**
- Brand Blue: `#005e9b` (primary), hover `#00497a`
- Navy Field (radial gradient): `#163e5d` / `#0f273a` / `#0b1e2e`
- Paper: `#f5f7f9`, Gray-100: `#e8ecef`, White: `#ffffff`
- Tatami washes (quiet backgrounds): `#ffb1a4` / `#e6e7d9` / `#d1c6c2`

**Typography:**
- Logo/Wordmark: Michroma
- Headings/Buttons/Nav: Archivo Bold, UPPERCASE, 0.04em tracking
- Eyebrow: 13px Archivo Semibold, 0.22em tracking, brand blue
- Body: Source Sans 3, 17px / 1.62 line height

**Surfaces:**
- Card radius: 8px
- Button radius: 999px (pill shape)
- Card shadow: `0 1px 2px rgba(11,30,46,.06), 0 8px 24px rgba(11,30,46,.08)`
- Hover shadow: elevated with 2px rise

**Motion:**
- Duration: 120ms (fast), 200ms (base), 420ms (slow)
- Easing: `cubic-bezier(0.2, 0.6, 0.2, 1)`
- Transitions: fades and 2px translations only (no bounce/spring)

**CSS Utility Classes:**
- `.eyebrow` - 13px Archivo Semibold, uppercase, brand blue
- `.wordmark` - Michroma font for logo text
- `.navy-field` - Radial gradient background
- `.card` - White card with shadow and hover effect
- `.btn-primary` - Solid blue pill button
- `.btn-secondary` - Outline button that inverts on hover
- `.app-header` - Sticky 76px navy header

### Design Philosophy

- **One blue** on a field of navy - no secondary brand hue
- No emoji, no colored left borders, no multi-hue gradients
- Prefer `•` and `→` typographic marks over icons
- ALL CAPS for headings, eyebrows, and buttons
- Warm, plain, slightly formal voice
- Judo vocabulary used and glossed (tokui-waza, kumi-kata, ne-waza)

## 🎯 Features

### Core Features

✅ **Coach Authentication**
- Navy-field login page with brand wordmark
- Password and magic link authentication (simulated for local dev)
- Auth gate protects all athlete and opponent data

✅ **Athlete Management (CRUD)**
- Add, edit, and delete athletes
- Track tokui-waza (favorite techniques)
- Document development areas
- Privacy-enforced: first name + last initial only

✅ **Matside Scouting Fields**
- **Stance**: left, right, or unknown
- **Kumi-kata**: grip style and preferences
- **Ne-waza**: ground game notes
- **Weight Class**: e.g. -57kg, -66kg
- **Age Division**: Juvenile, Cadet, Junior, etc.

✅ **Opponent Scouting Notes**
- Link detailed notes to specific athletes
- Track opponent stance, grip style, ground game
- **Common Counters**: tactical counter-techniques
- Club, tournament, and matchup context
- Same scouting fields as athletes
- Privacy-enforced for opponent names too

✅ **Printable Tournament-Day Profiles**
- Clean, one-page profiles per athlete
- Optimized for matside use by coaches
- Includes all scouting fields and opponent notes
- Print-optimized CSS (works with browser print or Save as PDF)
- **Works completely offline once loaded**

✅ **Premium Roster Cards**
- Scan 30+ athletes in seconds
- Shows stance, weight class, age division
- Opponent note counts at a glance
- Smooth hover animations and transitions

✅ **Local-First Architecture**
- All data stored in browser localStorage
- No database server required
- Works offline after initial page load
- Fast, instant updates with no network latency
- Complete data privacy (nothing leaves your device)

### Out of Scope (Not Yet Built)

The following features are **intentionally excluded** from this version:

❌ Badges and achievement tracking  
❌ Family/parent accounts  
❌ Mindbody integration  
❌ SmoothComp API integration  
❌ Photo uploads  
❌ Video storage  
❌ Public leaderboards  
❌ Multi-device sync  

These may be added in future iterations with explicit approval.

## 🔒 Privacy Rules (Non-Negotiable)

This application is built with **privacy-first** principles:

1. **Display Names**: Only first name + last initial (e.g., "Maya H.") — NEVER full last names
2. **No Photos/Videos**: No image or video storage of athletes (ours or opponents)
3. **Opponent Privacy**: Same naming rules apply to opponent notes
4. **Full Deletion**: Every athlete record can be fully deleted (hard delete with cascade to related notes)
5. **Type Safety**: Privacy rules are encoded in the data model and TypeScript types
6. **Local Storage Only**: All data stays in your browser — nothing sent to any server

### Privacy Implementation

- Data model enforces `lastInitial` as single character
- Type-safe validation ensures privacy constraints
- UI prevents full name entry
- Cascade deletes ensure no orphaned data
- No external data sharing or analytics
- localStorage isolation means data never leaves your device

## 📊 Domain Model

### Athlete

```typescript
{
  id: string
  firstName: string
  lastInitial: string          // Single character, uppercase
  tokuiWaza: string            // Favorite techniques
  developmentAreas: string     // Current focus areas
  notes: string                // General notes
  stance: 'left' | 'right' | 'unknown' | null
  kumiKata: string             // Grip style
  neWaza: string               // Ground game notes
  weightClass: string          // e.g. -57kg, -66kg
  ageDivision: string          // e.g. Juvenile, Cadet, Junior
  createdAt: string            // ISO timestamp
  updatedAt: string            // ISO timestamp
  opponentNotes: OpponentNote[]
}
```

### OpponentNote

```typescript
{
  id: string
  athleteId: string            // Links to our athlete
  opponentLabel: string        // First + last initial
  club: string | null          // Opponent's club (optional)
  notes: string                // Scouting notes
  tournament: string | null    // Context (optional)
  stance: 'left' | 'right' | 'unknown' | null
  kumiKata: string             // Opponent's grip style
  neWaza: string               // Opponent's ground game
  commonCounters: string       // Tactical counters
  weightClass: string          // e.g. -48kg
  ageDivision: string          // e.g. Juvenile
  createdAt: string            // ISO timestamp
}
```

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + custom design system tokens
- **Storage**: Browser localStorage (local-first)
- **Deployment**: Vercel (static/SSR)
- **Type Safety**: Full TypeScript coverage with custom types
- **Fonts**: Google Fonts (Michroma, Archivo, Source Sans 3)

### Why This Stack?

- **Next.js**: Modern, fast, production-ready with great Vercel integration
- **TypeScript**: Catch privacy violations and errors at compile time
- **localStorage**: Simple, reliable, no database complexity, works offline
- **Tailwind + Design Tokens**: Rapid UI development with brand consistency
- **Local-First**: Coaches need reliable offline access on tournament day

## 📁 Project Structure

```
/workspace
├── app/                          # Next.js App Router
│   ├── athletes/[id]/            # Athlete detail & edit
│   │   └── print/                # Printable profile
│   ├── login/                    # Coach authentication
│   ├── page.tsx                  # Home (athlete roster)
│   ├── layout.tsx                # Root layout + font loading
│   └── globals.css               # Design tokens + print CSS
├── lib/
│   ├── store.ts                  # localStorage data layer
│   └── types.ts                  # TypeScript type definitions
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## 💾 Data Storage & Management

### How Data Works

All athlete and opponent note data is stored in your browser's localStorage. This means:

- ✅ **Your data stays on your device** — complete privacy
- ✅ **Works offline** — once loaded, the app works without internet
- ✅ **Instant performance** — no network requests, no latency
- ✅ **Browser-specific** — data is tied to the browser and domain you're using

### Important Notes

- **Per-Browser Storage**: Data is isolated per browser. If you use Chrome and Firefox, they'll have separate data.
- **Private/Incognito Mode**: Data will be cleared when you close the private browsing session.
- **Clearing Browser Data**: If you clear your browser's site data or cookies, you'll lose your athlete data.
- **No Cloud Sync**: Data is not synced across devices. Each browser/device has its own isolated data.

### Managing Your Data

**To Reset/Clear All Data:**

Open your browser's Developer Console (F12) on the app, and run:

```javascript
localStorage.removeItem('judo-athletes');
localStorage.removeItem('judo-opponent-notes');
localStorage.removeItem('judo-initialized');
localStorage.removeItem('judo-auth');
location.reload();
```

The app will reseed with sample athletes on the next login.

**To Backup Your Data:**

1. Open Developer Console (F12)
2. Go to the "Application" or "Storage" tab
3. Find localStorage → your domain
4. Copy the values for:
   - `judo-athletes`
   - `judo-opponent-notes`
5. Save these JSON strings somewhere safe

**To Restore Data:**

1. Open Developer Console (F12)
2. Run:
```javascript
localStorage.setItem('judo-athletes', '<your-backup-json>');
localStorage.setItem('judo-opponent-notes', '<your-backup-json>');
localStorage.setItem('judo-initialized', 'true');
location.reload();
```

## 🚢 Deployment

### Deploy to Vercel (Recommended)

This app is optimized for Vercel deployment with a local-first architecture. No database configuration needed!

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import this GitHub repository
   - Vercel auto-detects Next.js

2. **Configure Build**:
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Install Command: `npm install` (auto-detected)
   - No environment variables needed!

3. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - You'll get a live URL (e.g., `https://judo-comp-analysis.vercel.app`)

4. **That's It!**:
   - No database to configure
   - No environment variables to set
   - All data storage happens client-side in the browser
   - Vercel serves a static/SSR Next.js app with no backend dependencies

### How Vercel Deployment Works

- **Static Pages**: The app is mostly static with client-side hydration
- **No API Routes Used for Data**: All CRUD operations happen client-side
- **localStorage in Browser**: Client-side storage for privacy and offline support
- **Fast Global CDN**: Vercel serves your app from edge locations worldwide
- **Automatic HTTPS**: Secure by default
- **Zero Configuration**: Just push to `main` branch and Vercel auto-deploys

### Manual Deployment (Any Node.js Host)

```bash
# Build the app
npm run build

# Start production server
npm start

# App runs on port 3000 by default
```

Supported hosts: Vercel, Netlify, Railway, Render, Fly.io, DigitalOcean App Platform, etc.

**Note**: Since data is stored client-side, the deployment environment doesn't matter — any static/SSR hosting works perfectly.

## 🧪 Development

### Available Scripts

```bash
npm run dev         # Start dev server (http://localhost:3000)
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Run Next.js linter
```

### Sample Data

On first login, the app automatically seeds 3 athletes with opponent notes:
- **Maya H.** - Seoi-nage specialist, right stance, -48kg Juvenile, 2 opponent notes
- **Alex K.** - Osoto-gari specialist, right stance, -66kg Cadet, 1 opponent note
- **Jordan T.** - Ko-uchi-gari specialist, left stance, -57kg Junior, 1 opponent note

This happens client-side in the browser when localStorage is empty. Click "Seed Data" in the header to reset the sample data.

## 🗺 What's Next?

Potential future iterations (pending approval):

1. **Export/Import** - JSON export for backup and data portability
2. **IndexedDB Migration** - More robust storage for larger datasets
3. **PWA Support** - Install as a native-feeling app with service workers
4. **Multi-Device Sync** - Optional cloud sync (while preserving offline-first)
5. **Enhanced Search/Filters** - Filter athletes by division, club, stance, etc.
6. **Tournament Mode** - Quick access to profiles during events
7. **Mobile Optimization** - Touch-friendly UI for tablet use
8. **Bulk PDF Export** - Export all profiles for tournament day
9. **Analytics** - Track athlete progress over time (local only)
10. **Supabase Integration** - Optional cloud backup with RLS policies

## 🐛 Known Limitations

- localStorage has ~5-10MB limit (sufficient for hundreds of athletes)
- Data is per-browser, not synced across devices (by design for privacy)
- No server-side backup (coaches should manually export important data)
- Print page requires JavaScript (but works offline once loaded)
- Authentication is simulated locally (production would use Supabase Auth)

## 🔄 Migration Notes

**Current Version**: Local-first with localStorage

**Scouting Fields Added**:
- Stance (left/right/unknown) for athletes and opponents
- Kumi-kata (grip style) for detailed matchup preparation
- Ne-waza (ground game notes)
- Common Counters (tactical analysis for opponents)
- Weight Class and Age Division for tournament organization

**Design System**:
- Silicon Valley Judo brand tokens (navy field, brand blue)
- Google Fonts: Michroma (logo), Archivo (headings), Source Sans 3 (body)
- Premium coach-tool aesthetic with matside-optimized print layout

If you need to preserve data from a previous version:
1. Export from the old version using the Prisma database
2. Transform the data to match the new localStorage format with scouting fields
3. Import using browser console (see "Managing Your Data" above)

## 📄 License

Private repository - Silicon Valley Judo internal use only.

## 🤝 Contributing

This is an internal tool for Silicon Valley Judo. Contact Jacob Mayeda for questions or feature requests.

---

**Built with ❤️ for Silicon Valley Judo coaches and athletes.**

**Now with local-first architecture — your data stays private and works offline!**
