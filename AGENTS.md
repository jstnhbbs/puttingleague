# Putting League

A single Next.js 14 app (App Router). Two user-facing features:

- Home page (`/`): a "Season 7 leaderboard (w/ drops)" plus links to per-season pages.
- Per-season score sheets (`/sheet/[id]`): a password-protected, editable weekly-score grid.

Scores are persisted through Next.js API routes (`app/api/*`) backed by **Turso / libSQL** (hosted SQLite). The frontend degrades gracefully when the database is unavailable (leaderboard shows "Database unavailable"; the sheet falls back to `localStorage`).

The `server/` directory is a **legacy** Express + SQLite setup (the "before" architecture described in `TURSO_VERCEL_DEPLOY.md`). It is not part of the current app and is not needed to run or test it.

## Cursor Cloud specific instructions

### Running / building
- Dev server: `npm run dev` (Next.js on http://localhost:3000). Build: `npm run build`. See `README.md`/`package.json` for the standard scripts.
- **Do not run `npm run build` while `npm run dev` is running.** They share the `.next/` directory; running a production build against a live dev server corrupts it (`Error: Cannot find module './948.js'`, API routes then return 500 and the UI shows "Database unavailable"). To recover: stop dev, `rm -rf .next`, then restart `npm run dev`.
- There is **no lint setup** (no ESLint config, no `lint` script). `next lint` only launches an interactive scaffolder — don't run it. Type-checking runs as part of `npm run build`.
- There are **no automated tests** in this repo.

### Database (Turso / libSQL) for local dev
- API routes require both `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`; otherwise routes report `not_configured` and return empty data (the app still renders).
- For local dev without a cloud Turso account, point at a **local file DB**: `@libsql/client` accepts `file:` URLs and ignores the auth token for them. This is configured in `.env.local` (gitignored) as:
  ```
  TURSO_DATABASE_URL=file:/workspace/server/data/puttingleague.db
  TURSO_AUTH_TOKEN=local-dev-unused
  ```
- The schema lives at `server/turso-schema.sql`. If the local DB file is missing, recreate and seed it once:
  ```
  node -e "const fs=require('fs');const{createClient}=require('@libsql/client');const c=createClient({url:'file:/workspace/server/data/puttingleague.db',authToken:'x'});c.executeMultiple(fs.readFileSync('server/turso-schema.sql','utf8')).then(()=>console.log('seeded'))"
  ```
- Both `.env.local` and `server/data/*.db` are gitignored, so they persist in the VM but are never committed.

### Feature gotchas
- The home leaderboard is **"w/ drops"** = each player's season total minus their two lowest weeks (`total_minus_two_lowest`). It is computed client-side from the raw weekly cells, so it needs **at least 3 weeks of scores** to show non-zero values (with ≤2 weeks entered, both weeks are dropped and everyone shows 0 — this is expected, not a bug).
- The score-sheet edit password is defined in `app/sheet/[id]/TestPageContent.tsx` (`EDIT_PASSWORD`, currently `admin123`).
- On first paint the home leaderboard can briefly show zeros/loading before `checkHealth` + `fetchCells` resolve; it populates within a second (a refresh forces it).
- Player columns for Season 6–7 are: Hunter, Trevor, Konner, Silas, Jason, Graham, Tyler, Brad.
