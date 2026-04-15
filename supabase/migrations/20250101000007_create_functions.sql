-- ============================================================
-- 007_create_functions.sql
-- Server-side business logic as SECURITY DEFINER functions.
-- All functions are idempotent via CREATE OR REPLACE.
-- ============================================================

-- --------------------------------------------------------
-- start_quiz_session()
-- Called by POST /api/quiz/start.
-- • If the caller already has a completed/timed_out session → raise exception.
-- • If the caller has an in_progress session → return its ID (resume).
-- • Otherwise → shuffle questions & answer options, create session, return ID.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_quiz_session()
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
BEGIN
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Check for an existing session for this user.
  SELECT id, status
  INTO   v_session_id, v_existing_status
  FROM   public.quiz_sessions
  WHERE  user_id = v_user_id;

  IF FOUND THEN
    IF v_existing_status IN ('completed', 'timed_out') THEN
      RAISE EXCEPTION 'already_completed';
    END IF;
    -- in_progress: return the existing session so the user can resume.
    RETURN v_session_id;
  END IF;

  -- Randomise question order using ORDER BY RANDOM().
  SELECT ARRAY_AGG(id ORDER BY RANDOM())
  INTO   v_question_ids
  FROM   public.questions
  WHERE  is_active = true;

  IF v_question_ids IS NULL OR ARRAY_LENGTH(v_question_ids, 1) = 0 THEN
    RAISE EXCEPTION 'no_active_questions';
  END IF;

  v_question_order := TO_JSONB(v_question_ids);

  -- For each question, shuffle the four option labels.
  v_answer_order := '{}'::JSONB;
  FOREACH v_q_id IN ARRAY v_question_ids LOOP
    SELECT TO_JSONB(ARRAY_AGG(opt ORDER BY RANDOM()))
    INTO   v_shuffled_opts
    FROM   UNNEST(ARRAY['A','B','C','D']::TEXT[]) AS opt;

    v_answer_order := v_answer_order
                   || JSONB_BUILD_OBJECT(v_q_id::TEXT, v_shuffled_opts);
  END LOOP;

  -- Create the session row.
  INSERT INTO public.quiz_sessions(
    user_id,
    question_order,
    answer_order,
    server_started_at,
    started_at,
    ip_address
  ) VALUES (
    v_user_id,
    v_question_order,
    v_answer_order,
    NOW(),
    NOW(),
    inet_client_addr()
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;


-- --------------------------------------------------------
-- get_my_ranking()
-- Called by GET /api/quiz/ranking.
-- Returns only the calling user's own rank data from the
-- materialised leaderboard – never any other user's data.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_ranking()
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
  RETURN QUERY
  SELECT
    lc.score             AS my_score,
    lc.rank              AS my_rank,
    lc.percentile_rank   AS my_percentile,
    lc.total_participants AS total_participants
  FROM public.leaderboard_cache lc
  WHERE lc.user_id = (SELECT auth.uid());
END;
$$;


-- --------------------------------------------------------
-- refresh_leaderboard()
-- Called after quiz submission via POST /api/quiz/submit.
-- Uses CONCURRENTLY so reads are not blocked during refresh.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_cache;
END;
$$;
