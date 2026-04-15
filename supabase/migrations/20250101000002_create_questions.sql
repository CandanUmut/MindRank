-- ============================================================
-- 002_create_questions.sql
-- The question bank.  correct_answer is stored here and is
-- NEVER exposed to the client via API during an active quiz.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.questions (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text  TEXT    NOT NULL,
  option_a       TEXT    NOT NULL,
  option_b       TEXT    NOT NULL,
  option_c       TEXT    NOT NULL,
  option_d       TEXT    NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation    TEXT    NOT NULL,
  category       TEXT    NOT NULL CHECK (category IN (
                   'General Knowledge',
                   'Mathematics',
                   'Physics',
                   'Chemistry',
                   'Logic & Problem Solving',
                   'Ethics & Philosophy',
                   'Science'
                 )),
  difficulty     TEXT    NOT NULL CHECK (difficulty IN ('Easy','Medium','Hard')),
  time_seconds   INTEGER NOT NULL DEFAULT 30,
  sort_order     INTEGER NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_questions_category  ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_active    ON public.questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_sort      ON public.questions(sort_order);
