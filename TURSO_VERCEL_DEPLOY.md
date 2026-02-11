# Deploying Putting League to Turso + Vercel

This guide covers moving from a local Node/Express + SQLite setup to **Turso** (edge SQLite) and **Vercel** (Next.js hosting with serverless API routes).

## Architecture

| Before | After |
|--------|--------|
| Next.js (static export) on GitHub Pages | Next.js on **Vercel** |
| Express server on Mac mini + Cloudflare tunnel | **Next.js API routes** on Vercel (same app) |
| SQLite file (`better-sqlite3`) | **Turso** (libSQL, hosted SQLite) |

- **Turso**: Same SQL and schema as SQLite; you get a URL and auth token. No file or server to run.
- **Vercel**: One deployment for both the app and the API. Frontend calls `/api/*` on the same domain (no CORS or separate API URL).

## 1. Create a Turso database

1. **Install Turso CLI** (one-time):
   ```bash
   brew install tursodatabase/tap/turso
   ```
2. **Log in** (opens browser):
   ```bash
   turso auth login
   ```
3. **Create a database**:
   ```bash
   turso db create puttingleague --region ord
   ```
   Use a [region](https://docs.turso.tech/help/regions) near you (e.g. `ord`, `iad`, `lhr`).
4. **Get URL and token**:
   ```bash
   turso db show puttingleague --url
   turso db tokens create puttingleague
   ```
   Save the URL and token; you’ll add them to Vercel env vars.

## 2. Apply schema and seed data

Turso doesn’t auto-create tables. Run the schema and seed once.

**Option A – Turso CLI (recommended)**  
From the project root:

```bash
# Schema + seed in one file (create this once - see below)
turso db shell puttingleague < server/turso-schema.sql
```

**Option B – One-time script**  
Use the script in `scripts/init-turso.js` (see repo). It uses `@libsql/client` to run the same SQL as the Express app (create tables, insert players and seasons).

After this, the Turso DB has the same structure as your current SQLite DB (players, seasons, season_players, scores, calculated_scores).

## 3. Add Turso + API routes to the Next.js app

- **Env**: In Vercel (and locally), set:
  - `TURSO_DATABASE_URL` = Turso DB URL  
  - `TURSO_AUTH_TOKEN` = Turso DB token  

- **Code** (already added in this repo):
  - `app/lib/db.ts` – Turso client and shared helpers (player lists, `cellKeyToRelational`, etc.).
  - `app/api/health/route.ts` – Health check.
  - `app/api/cells/route.ts` – GET (list cells for a season), POST (save one cell).
  - `app/api/cells/batch/route.ts` – POST (save many cells + recalc totals).
  - `app/api/cells/[cellKey]/route.ts` – DELETE one cell.

- **Frontend**: `app/lib/api.ts` uses `NEXT_PUBLIC_API_URL` when set; if unset (or when deployed to Vercel), it uses relative `/api`, so the same app works locally and on Vercel.

## 4. Vercel deployment

1. **Connect repo**: [vercel.com](https://vercel.com) → Import your Git repo.
2. **Environment variables** (Project → Settings → Environment Variables):
   - `TURSO_DATABASE_URL` = your Turso URL  
   - `TURSO_AUTH_TOKEN` = your Turso token  
   (No `NEXT_PUBLIC_API_URL` needed for production; the app uses `/api`.)
3. **Build**: Use default (e.g. `npm run build`). Do **not** use static export for this deployment (see below).
4. **Deploy**: Push to main (or your production branch); Vercel builds and deploys.

Your app and API will be at `https://your-project.vercel.app` (and your custom domain if you add one).

## 5. Next.js config for Vercel

The app is configured for standard Next.js (no static export), so API routes work when deployed to Vercel with Turso.

## 6. Local development with Turso

1. Create a `.env.local` in the project root:
   ```env
   TURSO_DATABASE_URL=libsql://...
   TURSO_AUTH_TOKEN=...
   ```
2. Run:
   ```bash
   npm run dev
   ```
3. The app will use `/api` (same origin); no separate Express server or tunnel needed.

## 7. Migrating existing data (SQLite → Turso)

If you have data in `server/data/puttingleague.db` and want to copy it to Turso:

1. **Turso schema must already be applied** (step 2 above). If the DB is brand new, run:
   ```bash
   turso db shell puttingleague < server/turso-schema.sql
   ```
2. **Set Turso env vars** (e.g. in project root `.env.local`):
   ```env
   TURSO_DATABASE_URL=libsql://...
   TURSO_AUTH_TOKEN=...
   ```
3. **Install server deps and run the migration** from the **server** directory (so `better-sqlite3` and `@libsql/client` are found):
   ```bash
   cd server
   npm install
   node migrate-sqlite-to-turso.js
   ```
   The script reads from `server/data/puttingleague.db` and writes to Turso. It loads `TURSO_*` from the project root `.env.local` if that file exists.

   If you prefer to set env vars manually:
   ```bash
   cd server
   export TURSO_DATABASE_URL="..."
   export TURSO_AUTH_TOKEN="..."
   node migrate-sqlite-to-turso.js
   ```

## Summary

- **Turso**: Hosted SQLite; you get a URL + token and run the same SQL (schema + app logic).
- **Vercel**: Hosts the Next.js app and API routes; set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`; no separate backend or tunnel.
- **Result**: One deployment, one domain, no “Health check: API server unreachable” from a separate server.
