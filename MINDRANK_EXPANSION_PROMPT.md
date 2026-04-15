# MindRank Platform Expansion — Multi-Phase Build Prompt

> **Context:** Phase 1 is complete. We have a working Next.js 14+ / Supabase quiz platform with 40 questions, anonymous auth, server-side scoring, a result sheet, and a basic leaderboard. The RESEARCH.md in this repository contains the foundational document. This prompt defines Phases 2–5 to transform MindRank from a single quiz into a full-featured, bilingual quiz platform with user accounts, multiple quiz categories, community-created quizzes, and a teaching-first results experience.

> **Guiding principle:** Every feature must make the user feel like they learned something and achieved something. This is not a trivia app — it is a growth tool. Design every screen with that intent.

---

## Architecture Evolution Overview

```
Phase 1 (DONE)     → Single quiz, anonymous auth, basic results
Phase 2 (THIS)     → Auth + user profiles, expanded quiz categories, question bank
Phase 3             → Turkish i18n, educational results, progress tracking
Phase 4             → Community quizzes, sharing, social features
Phase 5             → Design system, animations, polish, Vercel deployment
```

Each phase is independently deployable. No phase depends on a future phase. Every phase leaves the app in a working state.

---

## PHASE 2 — Authentication, Quiz Categories & Question Bank

### 2.1 — Authentication Migration

Replace anonymous auth with proper Supabase Auth supporting multiple providers.

**Requirements:**
- Email/password sign-up and sign-in with email confirmation
- Google OAuth as secondary option
- On sign-up, create a `profiles` row with: `id`, `display_name` (from email prefix or Google name), `avatar_url` (from Google or generated initials), `locale` (default 'en'), `created_at`
- Persistent sessions — user returns tomorrow and sees their history
- Auth middleware that protects `/quiz/*`, `/results/*`, `/profile/*` routes
- Landing page is public. User must sign in before starting any quiz
- Migrate existing anonymous sessions: if a user previously took the quiz anonymously and now signs up, we do NOT migrate their old data (clean slate — simpler, avoids edge cases)

**Profile page (`/profile`):**
- Display name (editable)
- Avatar (from OAuth or initials-based generated avatar — no upload for now)
- Quiz history: list of completed quizzes with date, category, score, percentage
- Overall stats: total quizzes taken, average score, strongest category, weakest category
- "My Created Quizzes" section (empty in Phase 2, populated in Phase 4)

**Database changes:**
```sql
-- Alter profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en' CHECK (locale IN ('en', 'tr')),
  ADD COLUMN IF NOT EXISTS total_quizzes_taken INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Remove UNIQUE(user_id) from quiz_sessions — users can now take multiple quizzes
ALTER TABLE public.quiz_sessions DROP CONSTRAINT IF EXISTS quiz_sessions_user_id_key;

-- Add quiz_type column to quiz_sessions
ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS quiz_type_id UUID REFERENCES public.quiz_types(id);
```

### 2.2 — Quiz Categories & Types

Expand from a single "General Knowledge" quiz to a category system.

**New table: `quiz_types`**
```sql
CREATE TABLE public.quiz_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- 'general-knowledge', 'iq-patterns', 'eq-emotional', etc.
  name_en TEXT NOT NULL,                -- English display name
  name_tr TEXT,                         -- Turkish display name (Phase 3)
  description_en TEXT NOT NULL,         -- 1-2 sentence description
  description_tr TEXT,                  -- Turkish description (Phase 3)
  icon TEXT NOT NULL,                   -- Emoji or icon identifier
  category_group TEXT NOT NULL,         -- 'mixed', 'single-domain', 'specialized'
  question_count INTEGER NOT NULL,      -- How many questions in this quiz
  time_limit_seconds INTEGER NOT NULL,  -- Global timer for this quiz type
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Quiz types to create at launch:**

| Slug | Name | Group | Questions | Time | Description |
|------|------|-------|-----------|------|-------------|
| `general-mixed` | General Knowledge Mix | mixed | 40 | 1500s | The original MindRank quiz — 7 categories, 40 questions |
| `math-only` | Mathematics Challenge | single-domain | 20 | 900s | Pure math: arithmetic, algebra, geometry, probability |
| `science-only` | Science Explorer | single-domain | 20 | 750s | Physics, chemistry, biology, earth science |
| `logic-only` | Logic & Reasoning | single-domain | 20 | 1200s | Pattern recognition, deduction, word problems |
| `iq-patterns` | IQ-Style Patterns | specialized | 25 | 1200s | Number sequences, spatial reasoning, pattern completion, analogies |
| `eq-emotional` | Emotional Intelligence | specialized | 20 | 900s | Scenario-based: empathy, self-awareness, social skills, emotional regulation |
| `ethics-dilemmas` | Ethical Dilemmas | single-domain | 15 | 900s | Trolley problems, fairness scenarios, applied ethics |
| `general-knowledge` | World Knowledge | single-domain | 20 | 600s | History, geography, culture, current affairs |
| `quick-10` | Quick 10 | mixed | 10 | 300s | 10 random questions across all categories — for users short on time |

**Question bank expansion:**

The `questions` table needs a new column linking to quiz types, but questions should be reusable across quiz types:

```sql
-- Junction table: which questions belong to which quiz types
CREATE TABLE public.quiz_type_questions (
  quiz_type_id UUID REFERENCES public.quiz_types(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  sort_order INTEGER,
  PRIMARY KEY (quiz_type_id, question_id)
);

-- Expand category CHECK to include new categories
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_category_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_category_check
  CHECK (category IN (
    'General Knowledge', 'Mathematics', 'Physics', 'Chemistry',
    'Logic & Problem Solving', 'Ethics & Philosophy', 'Science',
    'IQ Patterns', 'Emotional Intelligence', 'Spatial Reasoning',
    'Verbal Reasoning', 'History', 'Geography', 'Technology'
  ));

-- Add bilingual support columns to questions
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_text_tr TEXT,
  ADD COLUMN IF NOT EXISTS option_a_tr TEXT,
  ADD COLUMN IF NOT EXISTS option_b_tr TEXT,
  ADD COLUMN IF NOT EXISTS option_c_tr TEXT,
  ADD COLUMN IF NOT EXISTS option_d_tr TEXT,
  ADD COLUMN IF NOT EXISTS explanation_tr TEXT;
```

**Question sourcing strategy:**

For `general-mixed`, `math-only`, `science-only`, `logic-only`, `general-knowledge`, `ethics-dilemmas`:
- Use the existing 40 questions from RESEARCH.md as the base
- Write additional questions following the design principles in RESEARCH.md Part 2
- Each quiz type needs at minimum 2× its question_count (e.g., a 20-question quiz needs 40+ questions in the bank for randomization variety)
- Target: minimum 200 total questions across all standard categories

For `iq-patterns`:
- These are NOT knowledge questions — they are pattern recognition
- Number sequence completion (e.g., "2, 5, 11, 23, ?")
- Analogy questions (e.g., "Book is to Reading as Fork is to: ?")
- Logical deduction (e.g., "If all A are B, and some B are C...")
- Simple spatial/visual patterns described in text (no images in Phase 2)
- Write 50 IQ-style questions across Easy/Medium/Hard

For `eq-emotional`:
- Scenario-based questions with no objectively "correct" answer in the traditional sense
- Instead, answers are scored on a scale based on emotional intelligence research
- Example: "Your colleague takes credit for your work in a meeting. What do you do?" with options ranging from confrontational to assertive to passive
- Scoring: each option gets a point value (3, 2, 1, 0) rather than binary correct/incorrect
- This requires a schema addition: `point_value` column on answer options, or a JSONB `scoring` column on the question
- Write 40 EQ questions

**Scoring adaptation for EQ:**
```sql
-- Add flexible scoring support
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS scoring_type TEXT DEFAULT 'binary'
    CHECK (scoring_type IN ('binary', 'weighted')),
  ADD COLUMN IF NOT EXISTS option_weights JSONB DEFAULT '{"A": 1, "B": 0, "C": 0, "D": 0}';
-- For binary: correct = 1 point, incorrect = 0
-- For weighted: each option has its own point value (e.g., {"A": 3, "B": 2, "C": 1, "D": 0})
```

### 2.3 — Quiz Selection & Flow

**Home page redesign (`/`):**
- Hero section: "Discover what you know. Learn what you don't." (1 line, no wall of text)
- If not signed in: Sign In / Sign Up buttons prominently displayed
- If signed in: "Welcome back, {display_name}" with avatar
- Quiz category cards in a responsive grid (2 columns mobile, 3 desktop)
- Each card shows: icon, name, question count, time estimate, brief description, difficulty indicator (based on average scores if available)
- "Quick 10" card gets special placement — always visible, positioned as "Short on time?"

**Quiz start flow:**
1. User clicks a quiz card → modal or page showing: full description, category breakdown (for mixed quizzes), question count, time limit, "Start Quiz" button
2. On start: call `start_quiz_session()` with the `quiz_type_id` parameter
3. The RPC function selects `question_count` random questions from that quiz type's pool, randomizes order, randomizes answer options, creates session
4. Quiz proceeds as Phase 1 — sequential questions, global timer, server-side scoring

**Per-quiz leaderboards:**
- Each quiz type has its own leaderboard
- Leaderboard shows: rank, display_name (first name + last initial, e.g., "Umut C."), score, date
- User's own row is highlighted
- Top 10 are always visible; user's position is shown even if outside top 10
- Privacy: users can opt out of the public leaderboard in profile settings (their data still exists but display_name shows as "Anonymous")

**Database: leaderboard per quiz type**
```sql
-- Replace single materialized view with a function that filters by quiz type
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_quiz_type_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  display_name TEXT,
  score INTEGER,
  percentage NUMERIC,
  completed_at TIMESTAMPTZ,
  is_current_user BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      qs.user_id,
      p.display_name,
      qs.score,
      qs.percentage,
      qs.finished_at,
      RANK() OVER (ORDER BY qs.score DESC, qs.time_spent_seconds ASC) AS rank
    FROM public.quiz_sessions qs
    JOIN public.profiles p ON p.id = qs.user_id
    WHERE qs.quiz_type_id = p_quiz_type_id
      AND qs.status = 'completed'
      AND p.show_on_leaderboard = true
  )
  SELECT
    r.rank,
    r.display_name,
    r.score,
    r.percentage,
    r.finished_at,
    (r.user_id = auth.uid()) AS is_current_user
  FROM ranked r
  WHERE r.rank <= p_limit
     OR r.user_id = auth.uid()
  ORDER BY r.rank;
END;
$$;
```

### 2.4 — Phase 2 Deliverables Checklist

- [ ] Email/password + Google OAuth authentication working
- [ ] Profile page with display name, avatar, quiz history, stats
- [ ] 9 quiz types created and seeded
- [ ] Minimum 200 questions across standard categories seeded
- [ ] 50 IQ-pattern questions seeded
- [ ] 40 EQ scenario questions seeded with weighted scoring
- [ ] Quiz selection grid on home page
- [ ] Quiz flow works for all quiz types (including weighted scoring for EQ)
- [ ] Per-quiz-type leaderboards with display names
- [ ] Users can take multiple quizzes (one attempt per quiz type, or configurable)
- [ ] Leaderboard opt-out toggle in profile
- [ ] All new migrations are idempotent
- [ ] CI passes (lint, typecheck, build)
- [ ] Mobile responsive

---

## PHASE 3 — Turkish i18n, Educational Results & Progress Tracking

### 3.1 — Internationalization (i18n)

**Framework: `next-intl` (or `next-i18next`)**

- URL structure: `/en/quiz/...` and `/tr/quiz/...` with locale prefix
- Default locale: `en`, supported: `['en', 'tr']`
- Locale detection: check `profiles.locale` for signed-in users, browser `Accept-Language` for guests
- Locale switcher in header (flag + language name: 🇺🇸 English / 🇹🇷 Türkçe)
- User's preferred locale saved to `profiles.locale` and persisted

**Translation scope:**

| Layer | Approach |
|-------|----------|
| UI strings (buttons, labels, navigation, static text) | JSON message files: `messages/en.json`, `messages/tr.json` |
| Quiz type names & descriptions | Database columns: `name_tr`, `description_tr` on `quiz_types` |
| Questions & answers | Database columns: `question_text_tr`, `option_a_tr`... `explanation_tr` on `questions` |
| Results & recommendations | JSON message files with interpolation |

**Critical i18n rules:**
- Never auto-translate questions — each Turkish question must be culturally adapted, not literally translated. Some questions may need entirely different content for the Turkish version (e.g., a history question about the Rosetta Stone works globally, but a question referencing a Western-specific cultural concept should be swapped)
- Number formatting: Turkish uses comma for decimals, period for thousands (1.234,56)
- Date formatting: Turkish uses DD.MM.YYYY
- If a question doesn't have a Turkish translation yet, show the English version with a small "(English)" indicator — never show an empty question

**Seeding Turkish translations:**
- Translate all 40 original RESEARCH.md questions to Turkish
- For new questions added in Phase 2, prioritize translating the most popular quiz types first (general-mixed, quick-10)
- EQ questions need particular care in Turkish — emotional scenarios are culturally contextual

### 3.2 — Educational Results Experience

**This is the most important feature of Phase 3.** The current results page shows correct/incorrect. That is not enough. MindRank's purpose is learning, not judgment.

**Result sheet redesign — "Learn from Every Question":**

For each question the user got wrong:
1. Show the question, their answer (highlighted red), and the correct answer (highlighted green)
2. Show the explanation from the question bank (already exists)
3. **NEW: Add a "Why the others are wrong" micro-explanation** — 1 sentence per distractor explaining the misconception it represents
4. **NEW: Add a "Learn More" link** — a curated external URL (Khan Academy, Wikipedia, etc.) relevant to the concept tested
5. **NEW: Add a difficulty context line** — "72% of participants got this right" (once we have enough data) or the difficulty label if not enough data yet

For each question the user got right:
1. Show collapsed by default (checkmark + question text preview)
2. Expandable to see the explanation — reinforce correct understanding
3. If the user was slow (time > 2× average for that question's difficulty), show: "You got it right, but it took a while — worth reviewing"

**Database additions:**
```sql
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS distractor_explanations JSONB DEFAULT '{}',
  -- e.g., {"A": "This is the perimeter, not area", "B": "This confuses...", "D": "..."}
  ADD COLUMN IF NOT EXISTS learn_more_url TEXT,
  ADD COLUMN IF NOT EXISTS learn_more_url_tr TEXT,
  ADD COLUMN IF NOT EXISTS times_answered INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS times_correct INTEGER DEFAULT 0;
-- Aggregate difficulty: times_correct / times_answered gives real-world p-value
```

**Update aggregates on answer submission:**
```sql
-- Trigger or in the answer submission function:
UPDATE public.questions
SET times_answered = times_answered + 1,
    times_correct = times_correct + CASE WHEN is_correct THEN 1 ELSE 0 END
WHERE id = question_id;
```

**Category performance — growth framing:**
- Instead of "Developing" → use "Room to Grow 🌱"
- Instead of "Strong" → use "Solid Foundation 💪"
- Instead of "Exceptional" → use "Mastery Level ⭐"
- Add a line under each weak category: "Here is what to explore next:" with 1-2 specific resource links from the recommendation mapping in RESEARCH.md Part 4

**EQ quiz results — special treatment:**
- EQ has no "wrong" answers — frame results as a spectrum
- Show scores per EQ dimension: Self-Awareness, Self-Regulation, Empathy, Social Skills, Motivation
- Use a radar chart for visual representation
- Language: "Your responses suggest strong empathy but room to develop self-regulation strategies"
- Never frame EQ results as pass/fail

### 3.3 — Progress Tracking & History

**Progress dashboard (`/profile/progress`):**

- **Quiz timeline:** Chronological list of all completed quizzes with scores, showing improvement over time
- **Category strength map:** Aggregate performance across all quizzes, broken down by category — radar chart showing overall intellectual profile
- **Streak tracker:** "You have taken X quizzes this week/month" — simple engagement metric, no gamification pressure
- **Retake encouragement:** For quiz types the user scored below 70% on, show "Try again — you have learned from your mistakes" with a retake button. Allow unlimited retakes but track each attempt separately. Leaderboard uses best score.

**Database:**
```sql
-- Allow multiple attempts per quiz type
-- Remove any unique constraint on (user_id, quiz_type_id) if it exists
-- Instead, add a view for best scores:
CREATE OR REPLACE VIEW public.user_best_scores AS
SELECT DISTINCT ON (user_id, quiz_type_id)
  user_id, quiz_type_id, score, percentage, time_spent_seconds, finished_at
FROM public.quiz_sessions
WHERE status = 'completed'
ORDER BY user_id, quiz_type_id, score DESC, time_spent_seconds ASC;
```

### 3.4 — Phase 3 Deliverables Checklist

- [ ] `next-intl` configured with `/en` and `/tr` locale prefixes
- [ ] All UI strings translated to Turkish
- [ ] Original 40 questions translated to Turkish with cultural adaptation
- [ ] Locale switcher in header, preference saved to profile
- [ ] Number and date formatting respects locale
- [ ] Results page redesigned with educational focus
- [ ] Distractor explanations added to all questions
- [ ] "Learn More" URLs added to at least 80% of questions
- [ ] Real-world difficulty percentages shown when sufficient data exists
- [ ] EQ results use spectrum framing with radar chart
- [ ] Progress dashboard with timeline, category map, streak
- [ ] Retake system working — unlimited retakes, best score for leaderboard
- [ ] Growth-oriented language throughout (no "fail", no "wrong")
- [ ] CI passes, mobile responsive

---

## PHASE 4 — Community Quizzes & Sharing

### 4.1 — Quiz Builder

**Authenticated users can create custom quizzes.**

**Builder flow (`/create`):**
1. Quiz metadata: name, description, category (select from existing or "Custom"), question count target, time limit
2. Question builder — add questions one at a time:
   - Question text (required)
   - 4 answer options (required)
   - Mark correct answer (required)
   - Explanation (required — this is MindRank, we always teach)
   - Difficulty (Easy/Medium/Hard)
   - Suggested time per question (default 30s)
3. Preview mode: take your own quiz before publishing
4. Publish: quiz gets a unique shareable URL (`/quiz/community/{slug}`)

**Database:**
```sql
CREATE TABLE public.community_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_tr TEXT,
  description TEXT,
  description_tr TEXT,
  category TEXT DEFAULT 'Custom',
  question_count INTEGER NOT NULL,
  time_limit_seconds INTEGER NOT NULL DEFAULT 900,
  is_published BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,  -- for future moderation
  play_count INTEGER DEFAULT 0,
  avg_score NUMERIC(5,2),
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.community_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.community_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation TEXT NOT NULL,
  difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy','Medium','Hard')),
  time_seconds INTEGER DEFAULT 30,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: creators can CRUD their own quizzes; everyone can SELECT published quizzes
CREATE POLICY "creators_manage_own" ON public.community_quizzes
  FOR ALL TO authenticated
  USING (creator_id = (SELECT auth.uid()))
  WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "anyone_reads_published" ON public.community_quizzes
  FOR SELECT TO authenticated
  USING (is_published = true);
```

### 4.2 — Community Quiz Discovery

**Community page (`/community`):**
- Grid of published community quizzes
- Sort by: newest, most played, highest rated
- Filter by: category, question count range, language
- Each card shows: title, creator name, question count, play count, average score, language tag
- Search bar for finding specific quizzes

**Playing community quizzes:**
- Same quiz flow as official quizzes (timer, sequential, server-scored)
- Results page follows the same educational format
- Community quizzes have their own per-quiz leaderboards
- Community quiz results appear in the user's profile history (tagged as "Community")

### 4.3 — Sharing

- Every completed quiz result has a "Share" button generating a shareable card:
  - Image/OG card: "I scored 85% on MindRank's Logic Challenge! Think you can beat me?"
  - Shareable URL: `/quiz/{slug}?ref={user_id}` (tracks referrals, no reward system yet)
- Community quiz creators get a direct share link to their quiz
- Copy-to-clipboard and native share API (mobile)

### 4.4 — Phase 4 Deliverables Checklist

- [ ] Quiz builder with question creation, preview, and publish
- [ ] Community quizzes table with RLS policies
- [ ] Community discovery page with sort, filter, search
- [ ] Community quiz playing flow (same UX as official quizzes)
- [ ] Per-community-quiz leaderboards
- [ ] Share button on results with OG card generation
- [ ] Creator's "My Quizzes" section in profile with edit/unpublish
- [ ] Quiz play count and average score tracking
- [ ] CI passes, mobile responsive

---

## PHASE 5 — Design System, Animations, Polish & Deployment

### 5.1 — Design System

**This is where MindRank gets its identity.**

**Color palette:**
- Primary: Deep blue (#1e3a5f) — trust, intelligence
- Accent: Warm amber (#f59e0b) — achievement, energy
- Success: Emerald (#10b981)
- Error: Soft red (#ef4444) — never aggressive, never "WRONG"
- Background: Off-white (#fafafa) with subtle warm undertone
- Cards: White (#ffffff) with subtle shadow
- Text: Near-black (#1a1a2e) for headings, gray-700 for body

**Typography:**
- Headings: Inter (700 weight) — clean, modern, authoritative
- Body: Inter (400/500) — highly readable at all sizes
- Monospace (for scores, timers): JetBrains Mono

**Component refinements:**
- Quiz cards: subtle hover lift (transform: translateY(-2px)), soft shadow transition
- Answer options: border highlight on hover, smooth color transition on select, satisfying scale(0.98) on click
- Timer: color transitions from blue → amber (< 5 min) → red (< 1 min), subtle pulse animation under 30 seconds
- Score counters: animate from 0 to final value on results page (count-up animation)
- Category radar chart: animated draw-in on results page
- Page transitions: simple fade-in (no complex route animations — they slow things down)

### 5.2 — Micro-animations (purposeful, not decorative)

**Rule: every animation must communicate state or provide feedback. No animation exists just to look cool.**

| Element | Animation | Purpose |
|---------|-----------|---------|
| Answer selection | Border fills with color, subtle scale | Confirms selection registered |
| Correct answer reveal (results) | Green check fades in with slight bounce | Positive reinforcement |
| Incorrect answer reveal (results) | Red highlight slides in gently, correct answer pulses green | Redirects attention to learning |
| Timer warning | Gentle pulse at < 30s, faster pulse at < 10s | Urgency without panic |
| Score count-up | Numbers roll from 0 to final score over 1.5s | Moment of anticipation and achievement |
| Radar chart | Draws outward from center over 1s | Visual reveal of strengths |
| Progress bar (during quiz) | Smooth width transition per question | Shows forward momentum |
| Leaderboard rank | Slides to user's row with highlight | Draws attention to personal achievement |
| Streak counter | Subtle bounce when incremented | Acknowledges consistency |

**Animation library: Framer Motion** (already works well with Next.js, tree-shakeable, performant)

### 5.3 — Responsive & Accessibility Polish

- All interactive elements: minimum 44×44px touch targets on mobile
- Focus rings on all interactive elements (keyboard navigation)
- ARIA labels on quiz elements, timer, and results
- Reduced motion: respect `prefers-reduced-motion` — disable all animations, keep functionality
- Color contrast: all text meets WCAG AA (4.5:1 ratio minimum)
- Loading states: skeleton screens for quiz loading, spinner for leaderboard fetch
- Error states: friendly error messages with retry buttons, never technical jargon
- Toast notifications (via Sonner): for save confirmation, share success, error recovery

### 5.4 — Vercel Deployment

**Environment variables needed:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only, never exposed
NEXT_PUBLIC_APP_URL=                # For OG images and share links
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

**Vercel configuration:**
- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Node.js version: 20.x
- Environment variables: set in Vercel dashboard, not in repo
- Preview deployments: enabled for PRs
- Production branch: `main`

**GitHub Actions update — add deploy step:**
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Supabase migration strategy:**
- Migrations run manually via `supabase db push` for now
- Phase 5 adds a GitHub Action step that runs `supabase db push` against the production Supabase project on merge to main (requires `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID` secrets)

### 5.5 — SEO & Open Graph

- Dynamic OG images for quiz results (using `@vercel/og` or a simple SVG-based generator)
- Meta tags on all pages: title, description, OG image
- Structured data (JSON-LD) for the quiz pages
- Sitemap generation for public pages
- robots.txt allowing indexing of public pages only

### 5.6 — Phase 5 Deliverables Checklist

- [ ] Design system implemented: colors, typography, component styles
- [ ] All micro-animations implemented with Framer Motion
- [ ] `prefers-reduced-motion` respected throughout
- [ ] WCAG AA color contrast on all text
- [ ] 44×44px minimum touch targets on mobile
- [ ] ARIA labels on quiz, timer, results
- [ ] Loading skeletons and error states on all data-fetching pages
- [ ] Toast notifications for user actions
- [ ] Vercel deployment working via GitHub Actions
- [ ] Supabase migrations applied to production
- [ ] OG images generated for quiz results
- [ ] Meta tags and structured data on all pages
- [ ] Production environment variables configured
- [ ] Final smoke test: sign up → take quiz → see results → view leaderboard → create community quiz → share results

---

## Cross-Phase Concerns

### Question quality maintenance

As the question bank grows, quality degrades without discipline. Enforce these constraints:

1. Every question MUST have an explanation. The `explanation` column is NOT NULL. No exceptions.
2. Every question MUST have exactly 4 options with exactly 1 correct answer.
3. Distractor explanations (Phase 3+) should be added to all new questions at creation time.
4. Real-world difficulty (times_correct / times_answered) should be monitored. Questions with p-value > 0.95 (too easy) or < 0.15 (too hard) should be flagged for review.
5. Community questions do NOT go through this pipeline — they are separate from the official question bank and cannot be promoted to official status without manual review.

### Performance budgets

| Metric | Target |
|--------|--------|
| Largest Contentful Paint | < 2.5s |
| First Input Delay | < 100ms |
| Cumulative Layout Shift | < 0.1 |
| Time to Interactive (quiz page) | < 3s |
| API response (answer submission) | < 200ms |
| Bundle size (initial JS) | < 150KB gzipped |

### Security checklist (all phases)

- [ ] RLS enabled on every table, verified per migration
- [ ] `correct_answer` never in client-side API responses during quiz
- [ ] Server-side time validation on quiz submission
- [ ] Rate limiting on auth endpoints and answer submission
- [ ] Input sanitization on community quiz content (XSS prevention)
- [ ] CSRF protection via Supabase's built-in token handling
- [ ] No user PII in leaderboard responses except opted-in display name
- [ ] Service role key never exposed to client

---

## Summary: What each phase delivers to the user

| Phase | User experience |
|-------|----------------|
| Phase 1 ✅ | "I can take a quiz and see my score" |
| Phase 2 | "I can sign in, choose from different quiz types, see my name on leaderboards, and track my history" |
| Phase 3 | "I can use it in Turkish, I actually learn from my mistakes, and I can see myself improving over time" |
| Phase 4 | "I can create my own quizzes and challenge my friends" |
| Phase 5 | "This feels like a real product — polished, fast, and a pleasure to use" |

Each phase is a complete, deployable product improvement. Ship each one, test it with real users, then proceed.
