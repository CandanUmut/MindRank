-- ============================================================
-- 009_phase2_schema_changes.sql
-- Phase 2: Quiz types, expanded categories, profile updates,
-- weighted scoring, per-quiz leaderboards.
-- Idempotent: uses IF NOT EXISTS, DROP IF EXISTS, ADD IF NOT EXISTS.
-- ============================================================

-- --------------------------------------------------------
-- 1. Expand profiles table
-- --------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS total_quizzes_taken INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN DEFAULT true;

-- Add locale check constraint safely
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_locale_check
    CHECK (locale IN ('en', 'tr'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --------------------------------------------------------
-- 2. Create quiz_types table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_tr TEXT,
  description_en TEXT NOT NULL,
  description_tr TEXT,
  icon TEXT NOT NULL,
  category_group TEXT NOT NULL CHECK (category_group IN ('mixed', 'single-domain', 'specialized')),
  question_count INTEGER NOT NULL,
  time_limit_seconds INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_reads_quiz_types" ON public.quiz_types;
CREATE POLICY "anyone_reads_quiz_types" ON public.quiz_types
  FOR SELECT TO authenticated
  USING (is_active = true);

-- --------------------------------------------------------
-- 3. Create quiz_type_questions junction table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_type_questions (
  quiz_type_id UUID REFERENCES public.quiz_types(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  sort_order INTEGER,
  PRIMARY KEY (quiz_type_id, question_id)
);

ALTER TABLE public.quiz_type_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_reads_quiz_type_questions" ON public.quiz_type_questions;
CREATE POLICY "anyone_reads_quiz_type_questions" ON public.quiz_type_questions
  FOR SELECT TO authenticated
  USING (true);

-- --------------------------------------------------------
-- 4. Expand questions table
-- --------------------------------------------------------

-- Drop old category constraint and add expanded one
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_category_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_category_check
  CHECK (category IN (
    'General Knowledge', 'Mathematics', 'Physics', 'Chemistry',
    'Logic & Problem Solving', 'Ethics & Philosophy', 'Science',
    'IQ Patterns', 'Emotional Intelligence', 'Spatial Reasoning',
    'Verbal Reasoning', 'History', 'Geography', 'Technology'
  ));

-- Add bilingual and scoring columns
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_text_tr TEXT,
  ADD COLUMN IF NOT EXISTS option_a_tr TEXT,
  ADD COLUMN IF NOT EXISTS option_b_tr TEXT,
  ADD COLUMN IF NOT EXISTS option_c_tr TEXT,
  ADD COLUMN IF NOT EXISTS option_d_tr TEXT,
  ADD COLUMN IF NOT EXISTS explanation_tr TEXT,
  ADD COLUMN IF NOT EXISTS scoring_type TEXT DEFAULT 'binary',
  ADD COLUMN IF NOT EXISTS option_weights JSONB DEFAULT '{"A": 1, "B": 0, "C": 0, "D": 0}';

DO $$ BEGIN
  ALTER TABLE public.questions ADD CONSTRAINT questions_scoring_type_check
    CHECK (scoring_type IN ('binary', 'weighted'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --------------------------------------------------------
-- 5. Update quiz_sessions for multiple quiz types
-- --------------------------------------------------------

-- Remove single-attempt constraint
ALTER TABLE public.quiz_sessions DROP CONSTRAINT IF EXISTS quiz_sessions_user_id_key;

-- Add quiz_type_id column
ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS quiz_type_id UUID REFERENCES public.quiz_types(id);

CREATE INDEX IF NOT EXISTS idx_sessions_quiz_type ON public.quiz_sessions(quiz_type_id);

-- --------------------------------------------------------
-- 6. Update handle_new_user trigger for richer profiles
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Extract display name from email or metadata
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(COALESCE(NEW.email, 'User'), '@', 1),
    'User'
  );

  -- Use Google avatar if available
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  INSERT INTO public.profiles(id, display_name, avatar_url)
  VALUES (NEW.id, v_display_name, v_avatar_url)
  ON CONFLICT (id) DO UPDATE SET
    display_name = CASE
      WHEN public.profiles.display_name = 'Anonymous' THEN EXCLUDED.display_name
      ELSE public.profiles.display_name
    END,
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------
-- 7. Updated functions for Phase 2
-- --------------------------------------------------------

-- start_quiz_session now accepts a quiz_type_id parameter
CREATE OR REPLACE FUNCTION public.start_quiz_session(p_quiz_type_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id           UUID;
  v_session_id        UUID;
  v_existing_status   TEXT;
  v_question_ids      UUID[];
  v_question_order    JSONB;
  v_answer_order      JSONB;
  v_q_id              UUID;
  v_shuffled_opts     JSONB;
  v_question_count    INTEGER;
  v_max_score         INTEGER;
BEGIN
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Check for an existing in_progress session for this quiz type
  IF p_quiz_type_id IS NOT NULL THEN
    SELECT id, status
    INTO   v_session_id, v_existing_status
    FROM   public.quiz_sessions
    WHERE  user_id = v_user_id
      AND  quiz_type_id = p_quiz_type_id
      AND  status = 'in_progress';
  ELSE
    SELECT id, status
    INTO   v_session_id, v_existing_status
    FROM   public.quiz_sessions
    WHERE  user_id = v_user_id
      AND  quiz_type_id IS NULL
      AND  status = 'in_progress';
  END IF;

  IF FOUND AND v_existing_status = 'in_progress' THEN
    RETURN v_session_id;
  END IF;

  -- Get question count for this quiz type
  IF p_quiz_type_id IS NOT NULL THEN
    SELECT question_count INTO v_question_count
    FROM public.quiz_types WHERE id = p_quiz_type_id;

    IF v_question_count IS NULL THEN
      RAISE EXCEPTION 'invalid_quiz_type';
    END IF;

    -- Select random questions from the quiz type's pool
    SELECT ARRAY_AGG(q.id ORDER BY RANDOM())
    INTO   v_question_ids
    FROM   (
      SELECT qtq.question_id AS id
      FROM   public.quiz_type_questions qtq
      JOIN   public.questions qs ON qs.id = qtq.question_id
      WHERE  qtq.quiz_type_id = p_quiz_type_id
        AND  qs.is_active = true
      ORDER BY RANDOM()
      LIMIT  v_question_count
    ) q;
  ELSE
    -- Legacy: select all active questions
    v_question_count := 40;
    SELECT ARRAY_AGG(id ORDER BY RANDOM())
    INTO   v_question_ids
    FROM   public.questions
    WHERE  is_active = true;
  END IF;

  IF v_question_ids IS NULL OR ARRAY_LENGTH(v_question_ids, 1) = 0 THEN
    RAISE EXCEPTION 'no_active_questions';
  END IF;

  v_max_score := ARRAY_LENGTH(v_question_ids, 1);
  v_question_order := TO_JSONB(v_question_ids);

  -- Shuffle answer options for each question
  v_answer_order := '{}'::JSONB;
  FOREACH v_q_id IN ARRAY v_question_ids LOOP
    SELECT TO_JSONB(ARRAY_AGG(opt ORDER BY RANDOM()))
    INTO   v_shuffled_opts
    FROM   UNNEST(ARRAY['A','B','C','D']::TEXT[]) AS opt;

    v_answer_order := v_answer_order
                   || JSONB_BUILD_OBJECT(v_q_id::TEXT, v_shuffled_opts);
  END LOOP;

  INSERT INTO public.quiz_sessions(
    user_id,
    quiz_type_id,
    question_order,
    answer_order,
    max_possible_score,
    server_started_at,
    started_at,
    ip_address
  ) VALUES (
    v_user_id,
    p_quiz_type_id,
    v_question_order,
    v_answer_order,
    v_max_score,
    NOW(),
    NOW(),
    inet_client_addr()
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Per-quiz-type leaderboard function
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_quiz_type_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  display_name TEXT,
  score INTEGER,
  percentage NUMERIC,
  completed_at TIMESTAMPTZ,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      qs.user_id,
      p.display_name AS dn,
      qs.score AS sc,
      qs.percentage AS pct,
      qs.finished_at AS fa,
      RANK() OVER (ORDER BY qs.score DESC, qs.time_spent_seconds ASC) AS rk
    FROM public.quiz_sessions qs
    JOIN public.profiles p ON p.id = qs.user_id
    WHERE qs.quiz_type_id = p_quiz_type_id
      AND qs.status = 'completed'
      AND p.show_on_leaderboard = true
  )
  SELECT
    r.rk AS rank,
    r.dn AS display_name,
    r.sc AS score,
    r.pct AS percentage,
    r.fa AS completed_at,
    (r.user_id = (SELECT auth.uid())) AS is_current_user
  FROM ranked r
  WHERE r.rk <= p_limit
     OR r.user_id = (SELECT auth.uid())
  ORDER BY r.rk;
END;
$$;

-- Updated get_my_ranking to support quiz_type_id
CREATE OR REPLACE FUNCTION public.get_my_ranking(p_quiz_type_id UUID DEFAULT NULL)
RETURNS TABLE (
  my_score          INTEGER,
  my_rank           BIGINT,
  my_percentile     NUMERIC,
  total_participants BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF p_quiz_type_id IS NOT NULL THEN
    RETURN QUERY
    WITH all_scores AS (
      SELECT
        qs.user_id,
        qs.score,
        qs.time_spent_seconds,
        RANK() OVER (ORDER BY qs.score DESC, qs.time_spent_seconds ASC NULLS LAST) AS rank,
        ROUND((PERCENT_RANK() OVER (ORDER BY qs.score ASC) * 100)::numeric, 2) AS percentile_rank,
        COUNT(*) OVER () AS total
      FROM public.quiz_sessions qs
      WHERE qs.quiz_type_id = p_quiz_type_id
        AND qs.status IN ('completed', 'timed_out')
    )
    SELECT
      a.score AS my_score,
      a.rank AS my_rank,
      a.percentile_rank AS my_percentile,
      a.total AS total_participants
    FROM all_scores a
    WHERE a.user_id = (SELECT auth.uid());
  ELSE
    -- Legacy: use materialized view
    RETURN QUERY
    SELECT
      lc.score             AS my_score,
      lc.rank              AS my_rank,
      lc.percentile_rank   AS my_percentile,
      lc.total_participants AS total_participants
    FROM public.leaderboard_cache lc
    WHERE lc.user_id = (SELECT auth.uid());
  END IF;
END;
$$;

-- Increment total_quizzes_taken on profile after quiz completion
CREATE OR REPLACE FUNCTION public.increment_quiz_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('completed', 'timed_out') AND OLD.status = 'in_progress' THEN
    UPDATE public.profiles
    SET total_quizzes_taken = total_quizzes_taken + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_quiz_completed ON public.quiz_sessions;
CREATE TRIGGER on_quiz_completed
  AFTER UPDATE ON public.quiz_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_quiz_count();
