-- ============================================================
-- 006_create_rls_policies.sql
-- Row-Level Security policies for all tables.
-- Uses (SELECT auth.uid()) instead of auth.uid() directly for
-- the 100x+ performance gain via PostgreSQL initPlan caching.
-- ============================================================

-- --------------------------------------------------------
-- profiles
-- --------------------------------------------------------
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- --------------------------------------------------------
-- questions  (authenticated users may read active questions)
-- correct_answer is hidden at the API layer, not via RLS.
-- --------------------------------------------------------
DROP POLICY IF EXISTS "select_active_questions" ON public.questions;
CREATE POLICY "select_active_questions" ON public.questions
  FOR SELECT TO authenticated
  USING (is_active = true);

-- --------------------------------------------------------
-- quiz_sessions
-- --------------------------------------------------------
DROP POLICY IF EXISTS "select_own_sessions" ON public.quiz_sessions;
CREATE POLICY "select_own_sessions" ON public.quiz_sessions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "insert_own_session" ON public.quiz_sessions;
CREATE POLICY "insert_own_session" ON public.quiz_sessions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "update_own_active_session" ON public.quiz_sessions;
CREATE POLICY "update_own_active_session" ON public.quiz_sessions
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND status = 'in_progress'
  )
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- --------------------------------------------------------
-- user_answers
-- --------------------------------------------------------
DROP POLICY IF EXISTS "select_own_answers" ON public.user_answers;
CREATE POLICY "select_own_answers" ON public.user_answers
  FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.quiz_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_own_answers" ON public.user_answers;
CREATE POLICY "insert_own_answers" ON public.user_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.quiz_sessions
      WHERE user_id = (SELECT auth.uid())
        AND status = 'in_progress'
    )
  );
