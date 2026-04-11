# MindRank

A timed 40-question multiple-choice quiz spanning seven knowledge domains. Complete the quiz to receive a detailed score, per-category breakdown, and your anonymous percentile rank.

## Tech stack

- **Next.js 14** (App Router, TypeScript, Server Components)
- **Supabase** (Auth, PostgreSQL, Row-Level Security)
- **Tailwind CSS** (utility classes only)
- **GitHub Actions** (lint, type-check, build on push to `main`)

## Local development

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is sufficient)

### 2. Clone and install

```bash
git clone <repo-url>
cd mindrank
npm install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are in your Supabase dashboard under **Settings → API**.

### 4. Run the database migrations

Open the **Supabase SQL Editor** and run the migration files in order:

```
supabase/migrations/001_create_profiles.sql
supabase/migrations/002_create_questions.sql
supabase/migrations/003_create_quiz_sessions.sql
supabase/migrations/004_create_user_answers.sql
supabase/migrations/005_create_leaderboard_view.sql
supabase/migrations/006_create_rls_policies.sql
supabase/migrations/007_create_functions.sql
supabase/migrations/008_seed_questions.sql
```

All migrations are idempotent — safe to re-run.

> **Anonymous auth**: Enable **Anonymous sign-ins** in your Supabase dashboard under **Authentication → Providers → Anonymous**.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
mindrank/
├── .github/workflows/ci.yml          # Build, lint, type-check
├── supabase/migrations/               # 8 idempotent SQL migrations
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page
│   │   ├── quiz/page.tsx              # Quiz flow
│   │   ├── results/page.tsx           # Result sheet
│   │   ├── leaderboard/page.tsx       # Own rank & percentile
│   │   └── api/quiz/                  # Route handlers
│   │       ├── start/route.ts
│   │       ├── answer/route.ts
│   │       ├── submit/route.ts
│   │       ├── results/route.ts
│   │       └── ranking/route.ts
│   ├── lib/
│   │   ├── supabase/                  # Browser + server clients
│   │   ├── types/database.ts          # Hand-typed DB types
│   │   └── utils/                     # scoring.ts, shuffle.ts
│   └── components/                    # QuizQuestion, Timer, etc.
└── middleware.ts                       # Supabase session refresh
```

## How the quiz works

1. **Anonymous auth** — visiting the site auto-creates an anonymous Supabase session. No email or password required.
2. **One attempt** — the `UNIQUE(user_id)` constraint on `quiz_sessions` enforces a single attempt per user at the database level.
3. **Server-side scoring** — `correct_answer` is never sent to the client during an active quiz. All scoring happens in API route handlers.
4. **Randomisation** — question order and answer option order are shuffled per session inside the `start_quiz_session()` PostgreSQL function and stored in `JSONB` columns.
5. **Global timer** — 25-minute countdown. If the timer expires, the quiz is auto-submitted and scored.
6. **Leaderboard** — a materialized view (`leaderboard_cache`) is refreshed on each quiz submission via the `refresh_leaderboard()` RPC. Only each user's own rank/percentile is exposed.

## Deployment (Vercel)

1. Connect the GitHub repo to a Vercel project.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables in the Vercel dashboard.
3. Deploy — no build configuration changes needed.

## CI

GitHub Actions runs on every push to `main` and on pull requests:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

See `.github/workflows/ci.yml`.
