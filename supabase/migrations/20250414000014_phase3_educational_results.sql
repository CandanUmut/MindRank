-- ============================================================
-- 20250414000014_phase3_educational_results.sql
-- Phase 3: Educational results columns, difficulty tracking,
-- user best scores view.
-- ============================================================

-- Add educational result columns to questions
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS distractor_explanations JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learn_more_url TEXT,
  ADD COLUMN IF NOT EXISTS learn_more_url_tr TEXT,
  ADD COLUMN IF NOT EXISTS times_answered INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS times_correct INTEGER DEFAULT 0;

-- View for user best scores per quiz type (for retake system)
CREATE OR REPLACE VIEW public.user_best_scores AS
SELECT DISTINCT ON (user_id, quiz_type_id)
  user_id, quiz_type_id, score, percentage, time_spent_seconds, finished_at
FROM public.quiz_sessions
WHERE status = 'completed'
ORDER BY user_id, quiz_type_id, score DESC, time_spent_seconds ASC;
