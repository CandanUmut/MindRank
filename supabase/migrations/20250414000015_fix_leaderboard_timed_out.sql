-- Fix: users who finished a quiz in time were sometimes incorrectly marked
-- with status='timed_out' (due to drift between server_started_at and the
-- client-side Timer), which caused them to disappear from the leaderboard
-- even though get_my_ranking() still returned a rank for them. This created
-- confusing results where a user would see the "Time expired" banner instead
-- of their rank.
--
-- The submit endpoint has been updated to use "all questions answered" as the
-- ground-truth completion signal. This migration brings the leaderboard SQL
-- in line with get_my_ranking() so both functions consistently include
-- timed_out sessions (users who actually submitted).

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_quiz_type_id UUID,
  p_limit INTEGER DEFAULT 100
)
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
      AND qs.status IN ('completed', 'timed_out')
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

-- Back-heal: any past session where the user actually answered every question
-- but was recorded as timed_out (due to the old wall-clock-only classifier)
-- gets re-labeled as completed so the user sees a consistent "completed"
-- state on older attempts. question_order is stored as JSONB here, so use
-- jsonb_array_length rather than array_length.
UPDATE public.quiz_sessions qs
SET status = 'completed'
WHERE qs.status = 'timed_out'
  AND qs.question_order IS NOT NULL
  AND jsonb_typeof(qs.question_order) = 'array'
  AND jsonb_array_length(qs.question_order) > 0
  AND (
    SELECT COUNT(*) FROM public.user_answers ua WHERE ua.session_id = qs.id
  ) >= jsonb_array_length(qs.question_order);
