-- ============================================================
-- 008_seed_questions.sql
-- Inserts all 40 questions from RESEARCH.md Part 3.
-- Idempotent: ON CONFLICT (sort_order) DO NOTHING.
-- sort_order is the canonical question number (1–40).
-- ============================================================

-- Temporary unique constraint on sort_order for ON CONFLICT targeting.
-- (sort_order is NOT declared UNIQUE in the table DDL so we add it here.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'questions_sort_order_key'
  ) THEN
    ALTER TABLE public.questions ADD CONSTRAINT questions_sort_order_key UNIQUE (sort_order);
  END IF;
END;
$$;

INSERT INTO public.questions
  (question_text, option_a, option_b, option_c, option_d,
   correct_answer, explanation, category, difficulty, time_seconds, sort_order)
VALUES

-- ========================
-- GENERAL KNOWLEDGE (1–8)
-- ========================
(
  'What is the largest ocean on Earth?',
  'Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean',
  'A',
  'The Pacific Ocean covers ~165 million km², more than all of Earth''s land area combined.',
  'General Knowledge', 'Easy', 20, 1
),
(
  'Which planet is commonly known as the "Red Planet"?',
  'Venus', 'Jupiter', 'Saturn', 'Mars',
  'D',
  'Mars appears red due to iron oxide (rust) on its surface.',
  'General Knowledge', 'Easy', 20, 2
),
(
  'Who painted the Mona Lisa?',
  'Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Rembrandt',
  'A',
  'Leonardo da Vinci painted it between approximately 1503 and 1519; it hangs in the Louvre.',
  'General Knowledge', 'Easy', 20, 3
),
(
  'Which is the largest desert in the world by total area?',
  'Sahara Desert', 'Arabian Desert', 'Gobi Desert', 'Antarctic Polar Desert',
  'D',
  'The Antarctic Polar Desert covers ~14.2 million km². Deserts are defined by low precipitation, not temperature.',
  'General Knowledge', 'Medium', 25, 4
),
(
  'The Rosetta Stone contained inscriptions in how many writing systems?',
  'Two', 'Three', 'Four', 'Five',
  'B',
  'It bears the same decree in three scripts: Egyptian hieroglyphics, Demotic, and Ancient Greek.',
  'General Knowledge', 'Medium', 25, 5
),
(
  'Which language has the most native speakers in the world?',
  'English', 'Spanish', 'Mandarin Chinese', 'Hindi',
  'C',
  'Mandarin Chinese has ~920 million native speakers, the most of any language.',
  'General Knowledge', 'Medium', 25, 6
),
(
  'The Peace of Westphalia (1648) is regarded as establishing which concept in international relations?',
  'Freedom of the seas', 'Universal human rights', 'Collective security', 'State sovereignty',
  'D',
  'It established the principle that each nation-state has authority over its territory and domestic affairs.',
  'General Knowledge', 'Hard', 30, 7
),
(
  'Ancient Carthage, Rome''s rival in the Punic Wars, was located in what is now which country?',
  'Tunisia', 'Libya', 'Algeria', 'Egypt',
  'A',
  'Carthage was near present-day Tunis, destroyed by Rome in 146 BCE.',
  'General Knowledge', 'Hard', 30, 8
),

-- ========================
-- MATHEMATICS (9–14)
-- ========================
(
  'What is 15% of 200?',
  '25', '30', '35', '40',
  'B',
  '10% of 200 is 20, 5% is 10; 20 + 10 = 30.',
  'Mathematics', 'Easy', 30, 9
),
(
  'A rectangle has length 8 cm and width 5 cm. What is its area?',
  '13 cm²', '26 cm²', '40 cm²', '45 cm²',
  'C',
  'Area = length × width = 8 × 5 = 40 cm². Distractors 13 and 26 are perimeter-based errors.',
  'Mathematics', 'Easy', 30, 10
),
(
  'If 3x + 7 = 22, what is x?',
  '3', '5', '7', '15',
  'B',
  '3x = 15, so x = 5.',
  'Mathematics', 'Medium', 35, 11
),
(
  'A bag has 3 red, 4 blue, and 5 green balls. What is the probability of drawing a blue ball?',
  '1/4', '1/3', '5/12', '1/2',
  'B',
  'Total = 12; P(blue) = 4/12 = 1/3.',
  'Mathematics', 'Medium', 40, 12
),
(
  'What is the sum of all interior angles of a regular pentagon?',
  '540°', '360°', '450°', '720°',
  'A',
  '(n − 2) × 180° = 3 × 180° = 540°.',
  'Mathematics', 'Hard', 45, 13
),
(
  'What is the least common multiple (LCM) of 12 and 18?',
  '24', '36', '54', '72',
  'B',
  '12 = 2² × 3, 18 = 2 × 3²; LCM = 2² × 3² = 36.',
  'Mathematics', 'Hard', 50, 14
),

-- ========================
-- PHYSICS (15–19)
-- ========================
(
  'What is the SI unit of force?',
  'Joule', 'Pascal', 'Watt', 'Newton',
  'D',
  'The Newton is the force required to accelerate 1 kg at 1 m/s².',
  'Physics', 'Easy', 25, 15
),
(
  'According to Bernoulli''s principle, when fluid speed increases, its pressure:',
  'Increases proportionally', 'Remains constant', 'First increases, then decreases', 'Decreases',
  'D',
  'Conservation of energy in fluid flow: increased velocity means decreased pressure.',
  'Physics', 'Medium', 30, 16
),
(
  'Sound travels fastest through which medium?',
  'Vacuum', 'Air', 'Steel', 'Water',
  'C',
  'Sound travels ~5,100 m/s in steel vs ~1,500 m/s in water and ~343 m/s in air. It cannot travel through a vacuum.',
  'Physics', 'Medium', 30, 17
),
(
  'Snell''s law is a foundational principle of which branch of physics?',
  'Thermodynamics', 'Nuclear physics', 'Optics', 'Electrostatics',
  'C',
  'Snell''s law (n₁ sin θ₁ = n₂ sin θ₂) describes refraction of light between media.',
  'Physics', 'Hard', 35, 18
),
(
  'In a perfectly elastic collision, which two quantities are both conserved?',
  'Momentum and kinetic energy', 'Momentum and potential energy', 'Kinetic energy and force', 'Force and acceleration',
  'A',
  'A perfectly elastic collision conserves both total momentum and total kinetic energy.',
  'Physics', 'Hard', 40, 19
),

-- ========================
-- CHEMISTRY (20–23)
-- ========================
(
  'What is the chemical symbol for gold?',
  'Go', 'Gd', 'Au', 'Ag',
  'C',
  'Au comes from Latin "aurum." Ag is silver; Gd is gadolinium.',
  'Chemistry', 'Easy', 20, 20
),
(
  'Which element has the highest electronegativity?',
  'Fluorine', 'Chlorine', 'Oxygen', 'Nitrogen',
  'A',
  'Fluorine scores 3.98 on the Pauling scale — highest of any element.',
  'Chemistry', 'Medium', 25, 21
),
(
  'If reactant concentration increases at equilibrium, the system will:',
  'Remain unchanged', 'Shift toward more products', 'Shift toward more reactants', 'Reach equilibrium with fewer products',
  'B',
  'Le Chatelier''s principle: the system shifts to counteract the change by consuming the added reactant.',
  'Chemistry', 'Medium', 30, 22
),
(
  'Avogadro''s number (~6.022 × 10²³) represents the number of particles in:',
  'One gram of any substance', 'One litre of gas at STP', 'One kilogram of carbon-12', 'One mole of any substance',
  'D',
  'Avogadro''s number defines the number of particles in one mole of any substance.',
  'Chemistry', 'Hard', 30, 23
),

-- ========================
-- LOGIC & PROBLEM SOLVING (24–30)
-- ========================
(
  'What comes next in the sequence: 2, 6, 18, 54, ?',
  '108', '72', '216', '162',
  'D',
  'Each term is multiplied by 3: 54 × 3 = 162.',
  'Logic & Problem Solving', 'Easy', 30, 24
),
(
  'All cats are mammals. All mammals are animals. Which of the following must be true?',
  'All animals are cats', 'All animals are mammals', 'All cats are animals', 'Some animals are not mammals',
  'C',
  'Transitive logic: cats ⊂ mammals ⊂ animals, so all cats are animals.',
  'Logic & Problem Solving', 'Easy', 30, 25
),
(
  'A bag has 3 red and 5 blue balls. What is the probability that both balls drawn without replacement are red?',
  '3/28', '9/64', '1/8', '3/56',
  'A',
  'P = (3/8) × (2/7) = 6/56 = 3/28.',
  'Logic & Problem Solving', 'Medium', 45, 26
),
(
  'A car travels from X to Y at 60 km/h and returns at 40 km/h. What is the average speed for the round trip?',
  '50 km/h', '48 km/h', '46 km/h', '52 km/h',
  'B',
  'Harmonic mean: 2 × 60 × 40 / (60 + 40) = 4,800 / 100 = 48 km/h.',
  'Logic & Problem Solving', 'Medium', 45, 27
),
(
  'If the day after tomorrow is Thursday, what day was the day before yesterday?',
  'Saturday', 'Monday', 'Friday', 'Sunday',
  'D',
  'Day after tomorrow = Thursday → today = Tuesday → day before yesterday = Sunday.',
  'Logic & Problem Solving', 'Medium', 30, 28
),
(
  'A 3×3×3 cube painted on all faces is cut into 27 small cubes. How many small cubes have exactly 2 painted faces?',
  '6', '8', '12', '1',
  'C',
  'Edge-middle cubes have 2 painted faces. A cube has 12 edges × 1 middle piece each = 12.',
  'Logic & Problem Solving', 'Hard', 60, 29
),
(
  'Three boxes are mislabelled "Apples," "Oranges," and "Mixed." You draw one apple from the "Mixed" box. What is in the "Oranges" box?',
  'Mixed fruits', 'Only oranges', 'Only apples', 'Cannot be determined',
  'A',
  '"Mixed" label is wrong so the box contains only apples. "Oranges" cannot have oranges (wrong label) or apples (taken by Mixed), so it must contain mixed fruits.',
  'Logic & Problem Solving', 'Hard', 60, 30
),

-- ========================
-- ETHICS & PHILOSOPHY (31–35)
-- ========================
(
  'Which ethical theory judges actions by their consequences, aiming for the greatest good for the greatest number?',
  'Deontology', 'Existentialism', 'Utilitarianism', 'Virtue ethics',
  'C',
  'Utilitarianism, developed by Bentham and Mill, evaluates actions by their outcomes and overall well-being.',
  'Ethics & Philosophy', 'Easy', 25, 31
),
(
  'The trolley problem explores the tension between which two ethical frameworks?',
  'Moral relativism and absolutism', 'Consequentialism and deontology', 'Virtue ethics and existentialism', 'Empiricism and rationalism',
  'B',
  'It pits saving more lives (consequentialism) against the prohibition on using people as means (deontology).',
  'Ethics & Philosophy', 'Medium', 30, 32
),
(
  'Kant''s categorical imperative holds that an action is right if:',
  'It produces the greatest happiness', 'It reflects virtues of moral excellence', 'It is commanded by authority', 'Its principle could be willed as a universal law',
  'D',
  'Kant held that you should act only on maxims you could will to become universal laws for all rational beings.',
  'Ethics & Philosophy', 'Medium', 35, 33
),
(
  'The "veil of ignorance" thought experiment was proposed by:',
  'John Rawls', 'Thomas Hobbes', 'John Stuart Mill', 'Jean-Jacques Rousseau',
  'A',
  'Rawls introduced it in A Theory of Justice (1971) to derive fair principles of justice.',
  'Ethics & Philosophy', 'Hard', 30, 34
),
(
  'The Gettier problem (1963) challenges the classical definition of knowledge as:',
  'Empirical verification', 'Logical certainty', 'Justified true belief', 'Innate understanding',
  'C',
  'Gettier showed cases where a belief is justified and true but intuitively does not count as knowledge, undermining the JTB account.',
  'Ethics & Philosophy', 'Hard', 35, 35
),

-- ========================
-- SCIENCE — Biology, Earth Science, Technology (36–40)
-- ========================
(
  'Which organelle is primarily responsible for producing the cell''s ATP?',
  'Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus',
  'B',
  'Mitochondria perform cellular respiration, converting nutrients into ATP — the cell''s energy currency.',
  'Science', 'Easy', 20, 36
),
(
  'In which atmospheric layer does most of Earth''s weather occur?',
  'Stratosphere', 'Mesosphere', 'Thermosphere', 'Troposphere',
  'D',
  'The troposphere (surface to ~8–15 km) contains 75% of atmospheric mass and nearly all water vapour.',
  'Science', 'Easy', 20, 37
),
(
  'The process of new oceanic crust forming at mid-ocean ridges is called:',
  'Subduction', 'Seafloor spreading', 'Continental drift', 'Plate convergence',
  'B',
  'Magma rises at divergent boundaries, solidifies into new crust — confirmed in the 1960s as key evidence for plate tectonics.',
  'Science', 'Medium', 25, 38
),
(
  'When a single gene influences multiple unrelated traits, the phenomenon is called:',
  'Pleiotropy', 'Polygenic inheritance', 'Codominance', 'Epistasis',
  'A',
  'Pleiotropy (Greek: "many ways") occurs when one gene affects multiple phenotypic traits, as in Marfan syndrome.',
  'Science', 'Medium', 30, 39
),
(
  'The CRISPR-Cas9 gene-editing tool was adapted from a defence mechanism found in:',
  'Fungi', 'Plants', 'Viruses', 'Bacteria',
  'D',
  'CRISPR is a natural adaptive immune system in prokaryotes (bacteria and archaea) that stores fragments of viral DNA.',
  'Science', 'Hard', 30, 40
)

ON CONFLICT (sort_order) DO NOTHING;
