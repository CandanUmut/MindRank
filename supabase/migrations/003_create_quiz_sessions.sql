-- ============================================================
-- 003_create_quiz_sessions.sql
-- One row per user attempt.  UNIQUE(user_id) enforces
-- the single-attempt rule at the database level.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  server_started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at         TIMESTAMPTZ,
  server_finished_at  TIMESTAMPTZ,
  time_spent_seconds  INTEGER,
  score               INTEGER     NOT NULL DEFAULT 0,
  max_possible_score  INTEGER     NOT NULL DEFAULT 40,
  percentage          NUMERIC(5,2),
  status              TEXT        NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress','completed','timed_out','abandoned')),
  -- question_order: JSON array of question UUIDs in the randomised display order.
  question_order      JSONB       NOT NULL DEFAULT '[]',
  -- answer_order: map of question_id → [orig_opt, ...] giving the shuffled
  --   display positions.  E.g. ["C","A","D","B"] means display slot A shows
  --   original option C, slot B shows option A, etc.
  answer_order        JSONB       NOT NULL DEFAULT '{}',
  ip_address          INET,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)   -- one attempt per user
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sessions_user   ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_score  ON public.quiz_sessions(score DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.quiz_sessions(status);
