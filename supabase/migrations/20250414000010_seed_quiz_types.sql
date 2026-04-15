-- ============================================================
-- 010_seed_quiz_types.sql
-- Seed the 9 quiz types for Phase 2.
-- Idempotent via ON CONFLICT on slug.
-- ============================================================

INSERT INTO public.quiz_types (slug, name_en, description_en, icon, category_group, question_count, time_limit_seconds, sort_order)
VALUES
  ('general-mixed', 'General Knowledge Mix', 'The original MindRank quiz — 7 categories, 40 questions covering everything from mathematics to ethics.', '🧠', 'mixed', 40, 1500, 1),
  ('math-only', 'Mathematics Challenge', 'Pure math: arithmetic, algebra, geometry, and probability. Test your numerical reasoning.', '🔢', 'single-domain', 20, 900, 2),
  ('science-only', 'Science Explorer', 'Physics, chemistry, biology, and earth science. Explore the natural world.', '🔬', 'single-domain', 20, 750, 3),
  ('logic-only', 'Logic & Reasoning', 'Pattern recognition, deduction, and word problems. Sharpen your analytical mind.', '🧩', 'single-domain', 20, 1200, 4),
  ('iq-patterns', 'IQ-Style Patterns', 'Number sequences, analogies, spatial reasoning, and pattern completion.', '💡', 'specialized', 25, 1200, 5),
  ('eq-emotional', 'Emotional Intelligence', 'Scenario-based questions on empathy, self-awareness, social skills, and emotional regulation.', '❤️', 'specialized', 20, 900, 6),
  ('ethics-dilemmas', 'Ethical Dilemmas', 'Trolley problems, fairness scenarios, and applied ethics. No easy answers.', '⚖️', 'single-domain', 15, 900, 7),
  ('general-knowledge', 'World Knowledge', 'History, geography, culture, and current affairs from around the globe.', '🌍', 'single-domain', 20, 600, 8),
  ('quick-10', 'Quick 10', '10 random questions across all categories — perfect when you are short on time.', '⚡', 'mixed', 10, 300, 9)
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  description_en = EXCLUDED.description_en,
  icon = EXCLUDED.icon,
  category_group = EXCLUDED.category_group,
  question_count = EXCLUDED.question_count,
  time_limit_seconds = EXCLUDED.time_limit_seconds,
  sort_order = EXCLUDED.sort_order;
