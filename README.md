# Trinity — Sales Intelligence

A web platform to browse sales statistics for online chatters and the models
(creators) they work, built around the **infloww** export format. Track sales,
PPV unlock rates, fan conversion, messaging output and more — per chatter, per
model, per shift — and annotate the numbers with **events** (promotions,
takeovers, bad days, holidays).

> Ships pre-loaded with a real one-week infloww export as **sample data**. Import
> your own export to replace/extend it — data is saved in the browser and
> re-imports update existing rows.

## Features

- **Dashboard** — KPI cards (total sales, PPV unlock rate, fan conversion,
  messages) with animated counters + sparklines, sales-over-time chart with
  event markers, sales-by-shift, and top chatters / top models leaderboards.
- **Chatters** — sortable, searchable roster; per-chatter detail with sales
  trend, shift split, model breakdown, and the events affecting them.
- **Models** — same, from the creator side (platform, VIP/Free tier, the
  chatters working the account).
- **Shifts** — a per-day board (04–12 · 12–20 · 20–04) of who worked, which
  models they covered, and the day's events. Full-day exports show under "Full
  day"; per-shift exports light up the three shifts automatically.
- **Events** — create/edit/delete promotions, takeovers, bad days, holidays and
  notes, scoped to a model / chatter / shift / date range. They propagate to
  every view whose data they match.
- **Analytics** — revenue composition (PPV vs tips), PPV delivery channels
  (DM vs mass messages), and sales by account tier.
- **Import** — parses the infloww `.xlsx`/`.csv` in the browser and **upserts**
  rows (keyed by date + shift + chatter + creator), with a diff summary.
- Dark / light themes, responsive layout, motion throughout.

## The infloww data model

The finest-grain infloww sheet ("Detailed breakdown") is one row per
**(day, employee, creator)** — that's the canonical `StatRow`
([src/lib/types.ts](src/lib/types.ts)). Chatters and Models are derived from the
rows. The parser ([src/lib/import/parse-infloww.ts](src/lib/import/parse-infloww.ts))
also reads the shift from the report's time window, so exporting per-shift reports
segments the data into the three shifts with no extra work.

## Data & persistence

Two modes, chosen automatically at runtime:

- **Shared database** (when `POSTGRES_URL` is set): imports and events are stored
  in Postgres and served from `/api/*`, so the whole team sees the same data on
  every device. Imports upsert row-by-row (`ON CONFLICT (key) DO UPDATE`).
- **This browser** (no database): imports and events are saved to `localStorage`,
  merged over the bundled seed. Persists across reloads/sessions on that machine.

The store ([src/lib/store.tsx](src/lib/store.tsx)) probes `/api/data` on load and
switches modes with **no change to any screen**. The seed (`src/data/seed.json`)
is the initial data — it seeds the database on first run and is the fallback
dataset in browser mode.

## Backend setup (shared database on Vercel)

1. In your Vercel project → **Storage → Create Database → Postgres** (Neon).
   Choose a region near your team and click **Create**.
2. **Connect** the database to the Trinity project when prompted. Vercel injects
   `POSTGRES_URL` / `DATABASE_URL` into the project's environment automatically.
3. **Redeploy** (Deployments → ⋯ → Redeploy, or push a commit).

That's it — tables are created and seeded on the first request. The Import page
badge shows **“Shared database”** when it's live. To run against it locally, copy
the connection string into `.env.local` as `POSTGRES_URL=…` (see `.env.example`).

API routes: `GET /api/data`, `POST /api/import`, `POST /api/events`,
`PUT|DELETE /api/events/:id`, `POST /api/reset`.

## Tech stack

| Concern    | Choice |
|------------|--------|
| Framework  | Next.js 16 (App Router, React 19) |
| Language   | TypeScript |
| Styling    | Tailwind CSS v4 + a token-based design system |
| Charts     | Recharts · Tables: TanStack Table · Animation: Motion |
| Parsing    | SheetJS (`xlsx`) — in-browser import |
| Theming    | next-themes |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve the production build
```

## Deploying on Vercel

Standard Next.js app — zero config:

1. Push to GitHub (already at `github.com/Musaka96/Trinity`).
2. In Vercel: **New Project → Import** the repo → **Deploy**.

Every push to `main` triggers a new production deployment.

## Regenerating the seed

To rebuild `src/data/seed.json` from a new infloww file:

```bash
npx tsx scripts/generate-seed.ts <path-to-export.xlsx>
```
