-- ============================================================
-- 005_create_leaderboard_view.sql
-- Materialised view for rank/percentile lookups.
-- No pg_cron dependency – refreshed on-demand via
-- refresh_leaderboard() RPC (defined in 007_create_functions.sql).
-- REFRESH MATERIALIZED VIEW CONCURRENTLY requires a unique index.
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard_cache AS
SELECT
  qs.user_id,
  qs.score,
  qs.time_spent_seconds,
  qs.percentage,
  RANK() OVER (
    ORDER BY qs.score DESC,
             qs.time_spent_seconds ASC NULLS LAST
  )                                                         AS rank,
  ROUND(
    PERCENT_RANK() OVER (
      ORDER BY qs.score ASC
    ) * 100,
  2)                                                        AS percentile_rank,
  COUNT(*) OVER ()                                          AS total_participants
FROM public.quiz_sessions qs
WHERE qs.status IN ('completed', 'timed_out')
WITH NO DATA;

-- Unique index required for CONCURRENTLY refresh.
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user
  ON public.leaderboard_cache(user_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank
  ON public.leaderboard_cache(rank);

-- Populate initially so the view is queryable before the first quiz is submitted.
-- CONCURRENTLY cannot be used on empty/uninitialized views, so use plain REFRESH here.
REFRESH MATERIALIZED VIEW public.leaderboard_cache;
