-- ============================================================
-- 004_create_user_answers.sql
-- Stores the user's answer for each question in a session.
-- selected_answer stores the ORIGINAL option letter (A–D as
-- defined in the questions table), not the shuffled display label.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_answers (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID    NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id     UUID    NOT NULL REFERENCES public.questions(id),
  -- NULL = question was not answered (timeout / skip)
  selected_answer CHAR(1) CHECK (selected_answer IN ('A','B','C','D')),
  is_correct      BOOLEAN,
  time_taken_ms   INTEGER,
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, question_id)  -- one answer per question per session
);

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_answers_session  ON public.user_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON public.user_answers(question_id);
