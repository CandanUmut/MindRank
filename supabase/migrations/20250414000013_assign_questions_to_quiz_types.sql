-- ============================================================
-- 013_assign_questions_to_quiz_types.sql
-- Links questions to quiz types via the junction table.
-- Idempotent via ON CONFLICT.
-- ============================================================

-- Helper: assign all questions of given categories to a quiz type
-- We use a DO block for procedural logic.

DO $$
DECLARE
  v_qt_id UUID;
BEGIN

  -- 1. general-mixed: all original 7 categories
  SELECT id INTO v_qt_id FROM public.quiz_types WHERE slug = 'general-mixed';
  IF v_qt_id IS NOT NULL THEN
    INSERT INTO public.quiz_type_questions (quiz_type_id, question_id, sort_order)
    SELECT v_qt_id, q.id, ROW_NUMBER() OVER (ORDER BY q.sort_order)
    FROM public.questions q
    WHERE q.category IN ('General Knowledge', 'Mathematics', 'Physics', 'Chemistry',
                          'Logic & Problem Solving', 'Ethics & Philosophy', 'Science')
      AND q.is_active = true
      AND q.scoring_type = 'binary'
    ON CONFLICT (quiz_type_id, question_id) DO NOTHING;
  END IF;

  -- 2. math-only
  SELECT id INTO v_qt_id FROM public.quiz_types WHERE slug = 'math-only';
  IF v_qt_id IS NOT NULL THEN
    INSERT INTO public.quiz_type_questions (quiz_type_id, question_id, sort_order)
    SELECT v_qt_id, q.id, ROW_NUMBER() OVER (ORDER BY q.sort_order)
    FROM public.questions q
    WHERE q.category = 'Mathematics'
      AND q.is_active = true
      AND q.scoring_type = 'binary'
    ON CONFLICT (quiz_type_id, question_id) DO NOTHING;
  END IF;

  -- 3. science-only: Physics + Chemistry + Science
  SELECT id INTO v_qt_id FROM public.quiz_types WHERE slug = 'science-only';
  IF v_qt_id IS NOT NULL THEN
    INSERT INTO public.quiz_type_questions (quiz_type_id, question_id, sort_order)
    SELECT v_qt_id, q.id, ROW_NUMBER() OVER (ORDER BY q.sort_order)
    FROM public.questions q
    WHERE q.category IN ('Physics', 'Chemistry', 'Science')
      AND q.is_active = true
      AND q.scoring_type = 'binary'
    ON CONFLICT (quiz_type_id, question_id) DO NOTHING;
  END IF;

  -- 4. logic-only
  SELECT id INTO v_qt_id FROM public.quiz_types WHERE slug = 'logic-only';
  IF v_qt_id IS NOT NULL THEN
    INSERT INTO public.quiz_type_questions (quiz_type_id, question_id, sort_order)
    SELECT v_qt_id, q.id, ROW_NUMBER() OVER (ORDER BY q.sort_order)
    FROM public.questions q
    WHERE q.category = 'Logic & Problem Solving'
      AND q.is_active = true
      AND q.scoring_type = 'binary'
    ON CONFLICT (quiz_type_id, question_id) DO NOTHING;
  END IF;

  -- 5. iq-patterns
  SELECT id INTO v_qt_id FROM public.quiz_types WHERE slug = 'iq-patterns';
  IF v_qt_id IS NOT NULL THEN
    INSERT INTO public.quiz_type_questions (quiz_type_id, question_id, sort_order)
    SELECT v_qt_id, q.id, ROW_NUMBER() OVER (ORDER BY q.sort_order)
    FROM public.questions q
    WHERE q.category = 'IQ Patterns'
      AND q.is_active = true
      AND q.scoring_type = 'binary'
    ON CONFLICT (quiz_type_id, question_id) DO NOTHING;
  END IF;

  -- 6. eq-emotional
  SELECT id INTO v_qt_id FROM public.quiz_types WHERE slug = 'eq-emotional';
  IF v_qt_id IS NOT NULL THEN
    INSERT INTO public.quiz_type_questions (quiz_type_id, question_id, sort_order)
    SELECT v_qt_id, q.id, ROW_NUMBER() OVER (ORDER BY q.sort_order)
    FROM public.questions q
    WHERE q.category = 'Emotional Intelligence'
      AND q.is_active = true
    ON CONFLICT (quiz_type_id, question_id) DO NOTHING;
  END IF;

  -- 7. ethics-dilemmas
  SELECT id INTO v_qt_id FROM public.quiz_types WHERE slug = 'ethics-dilemmas';
  IF v_qt_id IS NOT NULL THEN
    INSERT INTO public.quiz_type_questions (quiz_type_id, question_id, sort_order)
    SELECT v_qt_id, q.id, ROW_NUMBER() OVER (ORDER BY q.sort_order)
    FROM public.questions q
    WHERE q.category = 'Ethics & Philosophy'
      AND q.is_active = true
      AND q.scoring_type = 'binary'
    ON CONFLICT (quiz_type_id, question_id) DO NOTHING;
  END IF;

  -- 8. general-knowledge: General Knowledge + History + Geography + Technology
  SELECT id INTO v_qt_id FROM public.quiz_types WHERE slug = 'general-knowledge';
  IF v_qt_id IS NOT NULL THEN
    INSERT INTO public.quiz_type_questions (quiz_type_id, question_id, sort_order)
    SELECT v_qt_id, q.id, ROW_NUMBER() OVER (ORDER BY q.sort_order)
    FROM public.questions q
    WHERE q.category IN ('General Knowledge', 'History', 'Geography', 'Technology')
      AND q.is_active = true
      AND q.scoring_type = 'binary'
    ON CONFLICT (quiz_type_id, question_id) DO NOTHING;
  END IF;

  -- 9. quick-10: ALL binary questions (random 10 picked at runtime)
  SELECT id INTO v_qt_id FROM public.quiz_types WHERE slug = 'quick-10';
  IF v_qt_id IS NOT NULL THEN
    INSERT INTO public.quiz_type_questions (quiz_type_id, question_id, sort_order)
    SELECT v_qt_id, q.id, ROW_NUMBER() OVER (ORDER BY q.sort_order)
    FROM public.questions q
    WHERE q.is_active = true
      AND q.scoring_type = 'binary'
    ON CONFLICT (quiz_type_id, question_id) DO NOTHING;
  END IF;

END $$;
