# Silicon Valley Judo - Competitor Analysis Dashboard

**Local-first coach scouting notes + printable offline tournament-day profiles.**

Privacy-first competitor analysis tool for judo coaches. Track athlete development and opponent scouting notes with printable tournament-day profiles. All data stored locally in your browser for complete privacy and offline access.

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

Open [http://localhost:3000](http://localhost:3000) to view the app.

On your first visit, the app automatically seeds 3 sample athletes with opponent notes so you can explore the features right away.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎯 What's In This Slice (v1)

This is the **first slice** of the Silicon Valley Judo Competitor Analysis Dashboard — a focused, working prototype with local-first architecture.

### Features Included

✅ **Athlete Management (CRUD)**
- Add, edit, and delete athletes
- Track tokui-waza (favorite techniques)
- Document development areas
- Add general notes
- Privacy-enforced: first name + last initial only

✅ **Opponent Scouting Notes**
- Link scouting notes to specific athletes
- Track opponent details (name, club, tournament)
- Add strategic notes for matchup preparation
- Privacy-enforced for opponent names too

✅ **Printable Tournament-Day Profiles**
- Clean, one-page profiles per athlete
- Print-optimized CSS (works with browser print or Save as PDF)
- Includes tokui-waza, development areas, and all opponent notes
- Matside-readable format
- **Works completely offline once loaded**

✅ **Local-First Architecture**
- All data stored in browser localStorage
- No database server required
- Works offline after initial page load
- Fast, instant updates with no network latency
- Complete data privacy (nothing leaves your device)

✅ **Deployment Ready**
- Vercel deployment configuration included
- Production build tested and working
- Static site with client-side data persistence
- No backend infrastructure needed

### Out of Scope (Not Yet Built)

The following features are **intentionally excluded** from this first slice:

❌ Badges and achievement tracking  
❌ Family/parent accounts  
❌ Mindbody integration  
❌ SmoothComp API (manual/CSV entry is sufficient for v1)  
❌ Photo uploads  
❌ Video storage  
❌ Harvey-style analysis (stance, kumi-kata)  
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
  createdAt: string            // ISO timestamp
}
```

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + custom print CSS
- **Storage**: Browser localStorage (local-first)
- **Deployment**: Vercel (static/SSR)
- **Type Safety**: Full TypeScript coverage with custom types

### Why This Stack?

- **Next.js**: Modern, fast, production-ready with great Vercel integration
- **TypeScript**: Catch privacy violations and errors at compile time
- **localStorage**: Simple, reliable, no database complexity, works offline
- **Tailwind**: Rapid UI development with excellent print utilities
- **Local-First**: Coaches need reliable offline access on tournament day

## 📁 Project Structure

```
/workspace
├── app/                          # Next.js App Router
│   ├── athletes/[id]/            # Athlete detail & edit
│   │   └── print/                # Printable profile
│   ├── page.tsx                  # Home (athlete list)
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles + print CSS
├── lib/
│   ├── store.ts                  # localStorage data layer
│   └── types.ts                  # TypeScript type definitions
├── prisma/                       # (Legacy - kept for reference)
│   ├── schema.prisma             # Original DB schema
│   └── seed.ts                   # Original seed script
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
└── vercel.json                   # Vercel deployment config
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
location.reload();
```

The app will reseed with sample athletes on the next page load.

**To Backup Your Data:**

1. Open Developer Console (F12)
2. Go to the "Application" or "Storage" tab
3. Find localStorage → `https://judo-comp-analysis.vercel.app` (or your domain)
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
- **No API Routes Used for Data**: API routes exist but are legacy (not used in production)
- **localStorage in Browser**: All CRUD operations happen client-side
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

On first visit, the app automatically seeds 3 athletes with opponent notes:
- **Maya H.** - Seoi-nage specialist, 2 opponent notes
- **Alex K.** - Osoto-gari specialist, 1 opponent note
- **Jordan T.** - Ko-uchi-gari specialist, 1 opponent note

This happens client-side in the browser when localStorage is empty.

## 🗺 What's Next?

Potential future iterations (pending approval):

1. **Export/Import** - JSON export for backup and data portability
2. **IndexedDB Migration** - More robust storage for larger datasets
3. **PWA Support** - Install as a native-feeling app with service workers
4. **Multi-Device Sync** - Optional cloud sync (while preserving offline-first)
5. **Enhanced Search/Filters** - Filter athletes by division, club, etc.
6. **Tournament Mode** - Quick access to profiles during events
7. **Mobile Optimization** - Touch-friendly UI for tablet use
8. **Bulk PDF Export** - Export all profiles for tournament day
9. **Analytics** - Track athlete progress over time (local only)

## 🐛 Known Limitations

- localStorage has ~5-10MB limit (sufficient for hundreds of athletes)
- Data is per-browser, not synced across devices (by design for privacy)
- No server-side backup (coaches should manually export important data)
- Print page requires JavaScript (but works offline once loaded)

## 🔄 Migration from Previous Version

**If you previously used the Prisma/SQLite version:**

The app has migrated to local-first storage. Your old SQLite data is not automatically migrated. This is a clean slate with client-side storage.

If you need to preserve old data:
1. Export from the old version using the Prisma database
2. Transform the data to match the localStorage format
3. Import using browser console (see "Managing Your Data" above)

## 📄 License

Private repository - Silicon Valley Judo internal use only.

## 🤝 Contributing

This is an internal tool for Silicon Valley Judo. Contact Jacob Mayeda for questions or feature requests.

---

**Built with ❤️ for Silicon Valley Judo coaches and athletes.**

**Now with local-first architecture — your data stays private and works offline!**
