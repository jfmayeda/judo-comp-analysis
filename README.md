# Silicon Valley Judo - Competitor Analysis Dashboard

**Coach scouting notes + printable offline tournament-day profiles.**

Privacy-first competitor analysis tool for judo coaches. Track athlete development and opponent scouting notes with printable tournament-day profiles.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/jfmayeda/judo-comp-analysis.git
cd judo-comp-analysis

# Install dependencies
npm install

# Set up the database and seed with sample data
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎯 What's In This Slice (v1)

This is the **first slice** of the Silicon Valley Judo Competitor Analysis Dashboard — a focused, working prototype.

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
- Works offline once loaded

✅ **Deployment Ready**
- Vercel deployment configuration included
- Production build tested and working
- SQLite database (file-based, portable)
- Environment-agnostic TypeScript code

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

These may be added in future iterations with explicit approval.

## 🔒 Privacy Rules (Non-Negotiable)

This application is built with **privacy-first** principles:

1. **Display Names**: Only first name + last initial (e.g., "Maya H.") — NEVER full last names
2. **No Photos/Videos**: No image or video storage of athletes (ours or opponents)
3. **Opponent Privacy**: Same naming rules apply to opponent notes
4. **Full Deletion**: Every athlete record can be fully deleted (hard delete with cascade to related notes)
5. **Type Safety**: Privacy rules are encoded in the data model and TypeScript types

### Privacy Implementation

- Database schema enforces `lastInitial` as single character
- API validation ensures privacy constraints
- UI prevents full name entry
- Cascade deletes ensure no orphaned data
- No external data sharing or analytics

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
  createdAt: DateTime
  updatedAt: DateTime
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
  createdAt: DateTime
}
```

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + custom print CSS
- **Database**: SQLite + Prisma ORM
- **Deployment**: Vercel-ready
- **Type Safety**: Full TypeScript coverage with Prisma types

### Why This Stack?

- **Next.js**: Modern, fast, production-ready
- **TypeScript**: Catch privacy violations at compile time
- **Prisma**: Type-safe database access with migrations
- **SQLite**: Simple, portable, no external dependencies
- **Tailwind**: Rapid UI development with print utilities

## 📁 Project Structure

```
/workspace
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── athletes/             # Athlete CRUD
│   │   └── opponent-notes/       # Opponent note CRUD
│   ├── athletes/[id]/            # Athlete detail & edit
│   │   └── print/                # Printable profile
│   ├── page.tsx                  # Home (athlete list)
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles + print CSS
├── lib/
│   └── db.ts                     # Prisma client
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Seed data
│   └── dev.db                    # SQLite database (generated)
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
└── vercel.json                   # Vercel deployment config
```

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import this GitHub repository
   - Vercel auto-detects Next.js

2. **Configure Build**:
   - Framework: Next.js
   - Build Command: `npm run build` (auto-detected)
   - Install Command: `npm install` (auto-detected)

3. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - You'll get a preview URL (e.g., `https://judo-comp-analysis.vercel.app`)

4. **Database Note**:
   - SQLite database is file-based
   - For production, run `npm run db:seed` locally and commit `prisma/dev.db`
   - OR: Migrate to Vercel Postgres/Supabase for production persistence

### Manual Deployment (Any Node.js Host)

```bash
# Build the app
npm run build

# Start production server
npm start

# App runs on port 3000 by default
```

Supported hosts: Vercel, Railway, Render, Fly.io, DigitalOcean App Platform, etc.

## 🧪 Development

### Available Scripts

```bash
npm run dev         # Start dev server (http://localhost:3000)
npm run build       # Build for production
npm start           # Start production server
npm run db:push     # Sync Prisma schema to database
npm run db:seed     # Seed database with sample data
```

### Database Management

```bash
# Reset database (careful!)
rm prisma/dev.db
npm run db:push
npm run db:seed
```

### Sample Data

The seed script creates 3 athletes with opponent notes:
- **Maya H.** - Seoi-nage specialist, 2 opponent notes
- **Alex K.** - Osoto-gari specialist, 1 opponent note
- **Jordan T.** - Ko-uchi-gari specialist, 1 opponent note

## 🗺 What's Next?

Potential future iterations (pending approval):

1. **SmoothComp API Integration** - Auto-import tournament brackets
2. **Enhanced Search/Filters** - Filter athletes by division, club, etc.
3. **Tournament Mode** - Quick access to profiles during events
4. **Mobile Optimization** - Touch-friendly UI for tablet use
5. **Export Options** - Bulk PDF export for tournament day
6. **Analytics** - Track athlete progress over time
7. **Multi-coach Support** - Team collaboration features

## 🐛 Known Limitations

- SQLite is file-based; production deployments should migrate to Postgres/Supabase for multi-user persistence
- No authentication yet (coach-only assumed)
- No image/video support (by design)
- CSV import not yet implemented (manual entry only)

## 📄 License

Private repository - Silicon Valley Judo internal use only.

## 🤝 Contributing

This is an internal tool for Silicon Valley Judo. Contact Jacob Mayeda for questions or feature requests.

---

**Built with ❤️ for Silicon Valley Judo coaches and athletes.**
