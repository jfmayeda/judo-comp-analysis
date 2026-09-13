# Deployment Instructions - Supabase Migration

## ✅ Migration Complete

The judo competition analysis app has been successfully migrated from localStorage to Supabase with coach authentication. PR #4 has been merged to `main`.

**PR**: https://github.com/jfmayeda/judo-comp-analysis/pull/4

---

## 🚀 Next Steps for Deployment

### Step 1: Add Environment Variables to Vercel

Vercel will auto-deploy from `main`, but you **must** add environment variables first:

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select project: `judo-comp-analysis`
3. Navigate to: **Settings → Environment Variables**
4. Add the following two variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://wnwcxousneqhzlkdzeku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-actual-anon-key>
```

**Get the anon key from**: 
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select project: `JudoCoach`
- Navigate to: **Settings → API**
- Copy the `anon` / `public` key (starts with `eyJ...`)

**Important**: 
- Set these variables for **Production, Preview, Development** (all three environments)
- After adding variables, trigger a new deployment (or wait for next auto-deploy)

### Step 2: Create First Coach User

After deployment, create coach accounts in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → **JudoCoach** project
2. Navigate to: **Authentication → Users**
3. Click **"Add User"** → **"Create new user"**
4. Enter coach email and either:
   - Set a password (coach can reset later), OR
   - Click "Send magic link" for passwordless auth

Repeat for each coach who needs access.

### Step 3: Test Deployment

1. Navigate to your Vercel deployment URL
2. You should be redirected to `/login`
3. Sign in with coach credentials
4. If no athletes exist, click **"Load Sample Data"** to seed 3 sample athletes
5. Test:
   - Creating/editing athletes
   - Adding opponent notes
   - Print profile page
   - Sign out and sign back in

---

## 🔒 Security Checklist

- [x] API keys are in environment variables (not committed)
- [x] `.env.local` is gitignored
- [x] RLS policies prevent anonymous access
- [x] DB constraint enforces `last_initial` length = 1
- [x] All pages require authentication

---

## 📊 Database Schema (Already Provisioned)

**Supabase Project**: JudoCoach  
**URL**: https://wnwcxousneqhzlkdzeku.supabase.co

### Tables

#### `athletes`
- `id` (UUID, primary key)
- `first_name` (TEXT, required)
- `last_initial` (TEXT, required, constraint: length = 1)
- `tokui_waza` (TEXT, default: '')
- `development_areas` (TEXT, default: '')
- `notes` (TEXT, default: '')
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `created_by` (UUID, references auth.users)

#### `opponent_notes`
- `id` (UUID, primary key)
- `athlete_id` (UUID, foreign key → athletes, ON DELETE CASCADE)
- `opponent_label` (TEXT, required)
- `club` (TEXT, nullable)
- `notes` (TEXT, required)
- `tournament` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ)
- `created_by` (UUID, references auth.users)

### RLS Policies
- **Authenticated users**: Full CRUD access to both tables
- **Anonymous users**: All operations blocked (prevents intel leaks)

---

## 📦 What Changed

### Before (v1)
- Browser localStorage
- No authentication
- Single-browser data
- Competition intel leak risk
- No multi-coach collaboration

### After (v2)
- Supabase PostgreSQL
- Coach authentication required
- Shared database across all coaches
- RLS prevents anonymous access
- Latest data available to all authenticated coaches

---

## 🔄 Migration Notes

**This is NOT a backwards-compatible migration.**

- Old localStorage data is **not automatically migrated** (by design)
- Coaches should re-enter active athletes and opponent notes
- Old localStorage data remains in individual browsers (accessible via console if needed)

### Clean Slate Rationale
1. **Privacy**: Ensure all data meets new DB constraints
2. **Security**: Start fresh with authenticated, RLS-protected data
3. **Simplicity**: No complex data migration scripts
4. **Small Dataset**: Re-entry is feasible for active athletes

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables" error
- Check that both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel
- Verify they're set for the correct environment (Production/Preview/Development)
- Trigger a new deployment after adding variables

### Login fails with "Invalid credentials"
- Verify coach user was created in Supabase Auth
- Check that user is using correct email/password
- For magic link: check spam folder, verify email link hasn't expired

### Cannot create athletes
- Verify user is signed in (check auth context)
- Check Supabase RLS policies allow authenticated CRUD
- Check browser console for specific error messages

### Build fails on Vercel
- Ensure `package.json` and `package-lock.json` are committed
- Check Vercel build logs for specific TypeScript errors
- Verify Next.js version compatibility (15.1.11)

---

## 📝 Post-Deployment Tasks

- [ ] Add environment variables to Vercel
- [ ] Trigger new deployment (or wait for auto-deploy)
- [ ] Create first coach user in Supabase Auth
- [ ] Test login and basic functionality
- [ ] Invite/create additional coach accounts
- [ ] Load sample data or re-enter active athletes
- [ ] Test print profile feature
- [ ] Verify multi-coach shared data works

---

## 📞 Support

For questions or issues:
- Check README.md for detailed documentation
- Review PR #4 for implementation details
- Contact Jacob Mayeda for access/permission issues

---

**Migration completed**: September 13, 2026  
**PR**: https://github.com/jfmayeda/judo-comp-analysis/pull/4  
**Build status**: ✅ Passing
