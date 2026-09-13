# Silicon Valley Judo - Competitor Analysis Dashboard

**Multi-coach shared database with auth-protected scouting notes + printable offline tournament-day profiles.**

Privacy-first competitor analysis tool for judo coaches. Track athlete development and opponent scouting notes with printable tournament-day profiles. Data is stored in a shared Supabase database with coach authentication required for all access.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- A modern web browser
- Supabase account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/jfmayeda/judo-comp-analysis.git
cd judo-comp-analysis

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Supabase credentials
```

### Environment Configuration

Create a `.env.local` file in the project root with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wnwcxousneqhzlkdzeku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**NEVER commit `.env.local` to git.** The `.gitignore` file is configured to exclude it.

Get your credentials from the Supabase project dashboard:
- Project: JudoCoach
- URL: https://wnwcxousneqhzlkdzeku.supabase.co
- Navigate to Settings → API to find your anon/public key

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app. You'll be redirected to the login page.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Authentication & Access

### Coach Authentication

All data access requires authentication. Coaches must sign in before viewing any athlete or opponent information.

**Login methods:**
1. **Email + Password**: Standard email/password authentication
2. **Magic Link**: Passwordless email magic link (recommended for ease of use)

### First-Time Setup

1. **Admin creates coach accounts in Supabase:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add User" → "Create new user"
   - Enter coach's email and either:
     - Set a temporary password (coach can reset later)
     - Or use "Send magic link" for passwordless auth

2. **Coach signs in:**
   - Navigate to the app URL
   - Enter email (and password if using password auth)
   - For magic link: click the link sent to their email

3. **Load sample data (optional):**
   - On first login, if no athletes exist, a "Load Sample Data" button appears
   - Click to seed 3 sample athletes with opponent notes
   - This helps coaches understand the system before adding real data

## 🎯 Features

### ✅ Multi-Coach Shared Database

- All coaches share the same athlete and opponent note data
- Real-time updates across all sessions
- No localStorage isolation issues
- Data persists across devices and browsers

### ✅ Coach Authentication

- Secure email-based authentication (password or magic link)
- Unauthenticated users cannot access any athlete data
- Row-level security (RLS) enforced in Supabase
- Anonymous access completely blocked

### ✅ Athlete Management (CRUD)

- Add, edit, and delete athletes
- Track tokui-waza (favorite techniques)
- Document development areas
- Add general notes
- Privacy-enforced: first name + last initial only

### ✅ Opponent Scouting Notes

- Link scouting notes to specific athletes
- Track opponent details (name, club, tournament)
- Add strategic notes for matchup preparation
- Privacy-enforced for opponent names too
- Cascade delete when athlete is removed

### ✅ Printable Tournament-Day Profiles

- Clean, one-page profiles per athlete
- Print-optimized CSS (works with browser print or Save as PDF)
- Includes tokui-waza, development areas, and all opponent notes
- Matside-readable format
- Works offline after initial load (requires auth first)

### ✅ Deployment Ready

- Vercel deployment configuration included
- Supabase backend fully configured
- Environment variable support
- Production build tested and working

## 🔒 Privacy Rules (Non-Negotiable)

This application is built with **privacy-first** principles:

1. **Display Names**: Only first name + last initial (e.g., "Maya H.") — NEVER full last names
2. **No Photos/Videos**: No image or video storage of athletes (ours or opponents)
3. **Opponent Privacy**: Same naming rules apply to opponent notes
4. **Full Deletion**: Every athlete record can be fully deleted (hard delete with cascade to related notes)
5. **Type Safety**: Privacy rules are encoded in the data model and TypeScript types
6. **Auth-Gated Access**: All data requires authentication — no public access to competition intelligence

### Privacy Implementation

- Data model enforces `last_initial` as single character (DB constraint)
- Type-safe validation ensures privacy constraints
- UI prevents full name entry
- Cascade deletes ensure no orphaned data
- Row-level security (RLS) prevents anonymous access
- Only authenticated coaches can view or modify data

## 📊 Database Schema

### Tables (Supabase)

#### `athletes`
```sql
CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_initial TEXT NOT NULL CHECK (length(last_initial) = 1),
  tokui_waza TEXT DEFAULT '',
  development_areas TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);
```

#### `opponent_notes`
```sql
CREATE TABLE opponent_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  opponent_label TEXT NOT NULL,
  club TEXT,
  notes TEXT NOT NULL,
  tournament TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);
```

### Row-Level Security (RLS)

Both tables enforce RLS policies:
- **Authenticated users**: Full CRUD access
- **Anonymous users**: No access (all operations blocked)

This prevents competition/trade-secret leaks from public access.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + custom print CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth (email/password + magic links)
- **Storage**: Supabase PostgreSQL with RLS
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Type Safety**: Full TypeScript coverage with custom types

### Why This Stack?

- **Next.js**: Modern, fast, production-ready with great Vercel integration
- **TypeScript**: Catch privacy violations and errors at compile time
- **Supabase**: Managed PostgreSQL + Auth + RLS for secure multi-coach access
- **Tailwind**: Rapid UI development with excellent print utilities
- **Vercel**: Zero-config deployment with automatic HTTPS and global CDN

### Migration from localStorage

**v1 (localStorage)** → **v2 (Supabase + Auth)**

Key changes:
- **Before**: Client-side localStorage, no auth, single-browser data
- **After**: Server-side Supabase DB, coach auth required, shared multi-coach data
- **Reason**: Prevent competition intel leaks + support multi-coach collaboration with latest shared data

## 📁 Project Structure

```
/workspace
├── app/
│   ├── athletes/[id]/
│   │   ├── page.tsx              # Athlete detail & edit (auth required)
│   │   └── print/page.tsx        # Printable profile (auth required)
│   ├── login/page.tsx            # Coach login (password or magic link)
│   ├── page.tsx                  # Home / athlete list (auth required)
│   ├── layout.tsx                # Root layout with AuthProvider
│   └── globals.css               # Global styles + print CSS
├── lib/
│   ├── supabase.ts               # Supabase client initialization
│   ├── supabase-store.ts         # Supabase data layer (CRUD operations)
│   ├── auth-context.tsx          # Auth context provider
│   ├── store.ts                  # (DEPRECATED) Old localStorage store
│   └── types.ts                  # TypeScript type definitions
├── .env.local.example            # Environment variable template
├── .env.local                    # (gitignored) Your actual env vars
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## 🚢 Deployment to Vercel

### Prerequisites

- GitHub repository connected to Vercel
- Supabase project created with tables and RLS policies configured
- Supabase API URL and anon key ready

### Step-by-Step Deployment

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import Project to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js settings

3. **Configure Environment Variables:**
   
   In Vercel project settings → Environment Variables, add:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://wnwcxousneqhzlkdzeku.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-actual-anon-key>
   ```
   
   **CRITICAL**: Use the **actual anon key** from your Supabase project dashboard (Settings → API).
   
   Set for: **Production, Preview, Development** (all environments)

4. **Deploy:**
   - Click "Deploy"
   - Vercel builds and deploys automatically
   - You'll get a live URL (e.g., `https://judo-comp-analysis.vercel.app`)

5. **Create First Coach Account:**
   
   Go to Supabase Dashboard → Authentication → Users:
   - Click "Add User" → "Create new user"
   - Enter coach email + password (or send magic link)
   - Coach can now sign in at your deployed URL

6. **Test Authentication:**
   - Navigate to your Vercel URL
   - Should redirect to `/login`
   - Sign in with coach credentials
   - Access should work; data should load from Supabase

### Automatic Deployments

Vercel automatically redeploys when you push to `main`:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel deploys automatically
```

## 🔄 Data Management

### Seeding Sample Data

For first-time setup or testing:

1. Sign in as a coach
2. If no athletes exist, click "Load Sample Data" button on home page
3. This creates 3 sample athletes with opponent notes

### Backup & Export

Data is stored in Supabase PostgreSQL. To backup:

**Option 1: Supabase Dashboard**
- Navigate to Database → Backups
- Supabase Pro plan includes automated daily backups

**Option 2: SQL Export**
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref <your-project-ref>

# Export data
supabase db dump -f backup.sql
```

### Migration from localStorage (v1)

If you have data in the old localStorage version:

1. Old data is **not automatically migrated** (by design)
2. This is a clean slate with shared database
3. Coaches should re-enter active athletes and notes
4. Old localStorage data remains in individual browsers (read-only via console if needed)

## 🐛 Known Limitations

- **Offline Access**: Print pages work offline after initial auth, but CRUD requires internet
- **Concurrent Edits**: No conflict resolution; last write wins (typical for small teams)
- **No Audit Log**: Supabase tracks `created_by` but not edit history (future enhancement)

## 🗺 What's Next?

Potential future iterations (pending approval):

1. **Audit Logging** - Track who edited what and when
2. **Real-Time Sync** - Live updates when another coach edits
3. **Enhanced Search/Filters** - Filter athletes by division, club, etc.
4. **Tournament Mode** - Quick access to profiles during events
5. **Mobile Optimization** - Touch-friendly UI for tablet use
6. **Bulk PDF Export** - Export all profiles for tournament day
7. **Analytics Dashboard** - Track athlete progress over time

## 📄 License

Private repository - Silicon Valley Judo internal use only.

## 🤝 Contributing

This is an internal tool for Silicon Valley Judo. Contact Jacob Mayeda for questions or feature requests.

---

**Built with ❤️ for Silicon Valley Judo coaches and athletes.**

**Now with Supabase authentication and shared database — secure, collaborative, and privacy-first!**
