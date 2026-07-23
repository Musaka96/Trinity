# Trinity — Sales Intelligence

A web platform to browse sales statistics for online chatters and the models they
work. Track revenue across **three daily shifts**, see who worked which models, and
analyze performance by chatter, model, platform, and team. Built to import data
from **inflow**.

> The app currently runs on deterministic **sample data** so the whole UI is
> populated and demoable. Swap in real data by replacing `src/lib/mock-data.ts`
> with the inflow import — every page reads through the selectors in
> `src/lib/analytics.ts`, so nothing else has to change.

## Features

- **Dashboard** — KPI cards (net revenue, PPV unlock rate, messages, active chatters)
  with animated counters and sparklines, revenue-over-time area chart, revenue-by-shift,
  and top chatters / top models leaderboards.
- **Chatters** — sortable, searchable roster with 30-day performance; per-chatter
  detail page with revenue trend, shift split, and model breakdown.
- **Models** — same, from the model side (platform, subscribers, chatters on the model).
- **Shifts** — a day-by-day board of the three shifts showing who worked and which
  models they covered, with a date switcher.
- **Analytics** — stacked revenue composition by shift, platform donut, team performance.
- **Import** — inflow upload/connect flow with the expected column → field mapping.
- Dark / light themes, responsive layout, motion throughout.

## Tech stack

| Concern    | Choice |
|------------|--------|
| Framework  | Next.js 16 (App Router, React 19) |
| Language   | TypeScript |
| Styling    | Tailwind CSS v4 + a token-based design system |
| Charts     | Recharts |
| Tables     | TanStack Table |
| Animation  | Motion (Framer Motion) |
| Icons      | lucide-react |
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

This is a standard Next.js app and deploys on Vercel with zero configuration:

1. Push this repo to GitHub (already at `github.com/Musaka96/Trinity`).
2. In Vercel, **New Project → Import** the `Trinity` repo.
3. Accept the defaults (Framework preset: Next.js) and **Deploy**.

Every push to `main` then triggers a new production deployment.

## Project structure

```
src/
  app/                 # routes (dashboard, chatters, models, shifts, analytics, import)
  components/
    ui/                # primitives: card, button, badge, avatar
    charts/            # Recharts chart components
    layout/            # app shell, sidebar, nav
    tables/            # data-table column definitions
  lib/
    types.ts           # domain model (Chatter, Model, Shift, SalesRecord)
    mock-data.ts       # seeded sample data — replace with the inflow import
    analytics.ts       # pure selectors/aggregations the pages read from
    utils.ts           # formatting + cn()
```

## Connecting inflow (next step)

The `SalesRecord` shape in `src/lib/types.ts` mirrors an inflow-style row. To go
live: parse the inflow export (or hit its API) into `SalesRecord[]`, `Chatter[]`,
and `Model[]`, and export those from a module the way `mock-data.ts` does today.
See the **Import** page for the column mapping.
