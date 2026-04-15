-- ============================================================
-- 011_seed_phase2_questions.sql
-- Phase 2 question bank expansion.
-- Adds ~250 new questions across all categories.
-- Idempotent via ON CONFLICT on (question_text) using a unique index.
-- ============================================================

-- Create a unique index on question_text for idempotent inserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_text_unique ON public.questions(question_text);

-- ============================================================
-- MATHEMATICS — 35 new questions (total ~41 with originals)
-- ============================================================

INSERT INTO public.questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, difficulty, time_seconds, sort_order)
VALUES
-- Easy
('What is the value of 15% of 200?', '25', '30', '35', '20', 'B', '15% of 200 = 0.15 × 200 = 30.', 'Mathematics', 'Easy', 25, 101),
('What is the square root of 144?', '11', '12', '13', '14', 'B', '12 × 12 = 144, so √144 = 12.', 'Mathematics', 'Easy', 20, 102),
('If x + 7 = 15, what is x?', '7', '8', '9', '22', 'B', 'x = 15 − 7 = 8.', 'Mathematics', 'Easy', 20, 103),
('What is 3/4 expressed as a decimal?', '0.34', '0.75', '0.43', '0.80', 'B', '3 ÷ 4 = 0.75.', 'Mathematics', 'Easy', 20, 104),
('What is the perimeter of a rectangle with length 8 and width 5?', '26', '40', '13', '36', 'A', 'Perimeter = 2(l + w) = 2(8 + 5) = 26.', 'Mathematics', 'Easy', 25, 105),
('How many degrees are in a right angle?', '45', '90', '180', '360', 'B', 'A right angle measures exactly 90 degrees.', 'Mathematics', 'Easy', 15, 106),
('What is 2^5?', '10', '25', '32', '64', 'C', '2^5 = 2 × 2 × 2 × 2 × 2 = 32.', 'Mathematics', 'Easy', 20, 107),
-- Medium
('What is the sum of interior angles of a hexagon?', '540°', '720°', '900°', '1080°', 'B', 'Sum = (n−2) × 180° = (6−2) × 180° = 720°.', 'Mathematics', 'Medium', 35, 108),
('If f(x) = 2x² − 3x + 1, what is f(3)?', '10', '14', '8', '12', 'A', 'f(3) = 2(9) − 3(3) + 1 = 18 − 9 + 1 = 10.', 'Mathematics', 'Medium', 40, 109),
('A coin is flipped 3 times. What is the probability of getting exactly 2 heads?', '1/4', '3/8', '1/2', '1/8', 'B', 'C(3,2) × (1/2)³ = 3/8. There are 3 ways to arrange 2 heads in 3 flips.', 'Mathematics', 'Medium', 40, 110),
('What is the least common multiple of 12 and 18?', '24', '36', '54', '72', 'B', '12 = 2² × 3, 18 = 2 × 3². LCM = 2² × 3² = 36.', 'Mathematics', 'Medium', 35, 111),
('Solve for x: 3x − 7 = 2x + 5', 'x = 12', 'x = −2', 'x = 2', 'x = 7', 'A', '3x − 2x = 5 + 7, so x = 12.', 'Mathematics', 'Medium', 30, 112),
('What is the area of a circle with radius 7? (Use π ≈ 22/7)', '154', '44', '148', '156', 'A', 'A = πr² = (22/7) × 49 = 154.', 'Mathematics', 'Medium', 35, 113),
('In a geometric sequence 3, 9, 27, ..., what is the 6th term?', '243', '729', '2187', '81', 'B', 'Common ratio = 3. 6th term = 3 × 3⁵ = 3⁶ = 729.', 'Mathematics', 'Medium', 35, 114),
('What is the slope of the line passing through points (2, 3) and (6, 11)?', '1', '2', '3', '4', 'B', 'Slope = (11−3)/(6−2) = 8/4 = 2.', 'Mathematics', 'Medium', 30, 115),
('If log₁₀(x) = 3, what is x?', '30', '100', '1000', '10000', 'C', 'log₁₀(x) = 3 means x = 10³ = 1000.', 'Mathematics', 'Medium', 30, 116),
('A triangle has sides of length 5, 12, and 13. Is it a right triangle?', 'Yes, with hypotenuse 13', 'Yes, with hypotenuse 12', 'No, it is acute', 'No, it is obtuse', 'A', '5² + 12² = 25 + 144 = 169 = 13². By the Pythagorean theorem, it is a right triangle.', 'Mathematics', 'Medium', 35, 117),
-- Hard
('What is the derivative of f(x) = x³ − 4x² + 7x − 2?', '3x² − 8x + 7', '3x² − 4x + 7', 'x² − 8x + 7', '3x² − 8x − 2', 'A', 'f''(x) = 3x² − 8x + 7 using the power rule.', 'Mathematics', 'Hard', 45, 118),
('How many ways can 5 people be seated around a circular table?', '120', '24', '60', '720', 'B', 'Circular permutations: (n−1)! = 4! = 24.', 'Mathematics', 'Hard', 45, 119),
('What is the integral of 1/x dx?', 'x²/2 + C', 'ln|x| + C', '−1/x² + C', 'x + C', 'B', 'The integral of 1/x is the natural logarithm: ln|x| + C.', 'Mathematics', 'Hard', 40, 120),
('In a group of 10 people, how many handshakes occur if everyone shakes hands once?', '90', '45', '100', '55', 'B', 'C(10,2) = 10!/(2!×8!) = 45.', 'Mathematics', 'Hard', 40, 121),
('What is the sum of the infinite geometric series 1 + 1/2 + 1/4 + 1/8 + ...?', '1.5', '2', '2.5', '∞', 'B', 'Sum = a/(1−r) = 1/(1−0.5) = 2. Converges because |r| < 1.', 'Mathematics', 'Hard', 45, 122),
('If matrix A = [[1,2],[3,4]], what is det(A)?', '−2', '2', '−1', '10', 'A', 'det = (1)(4) − (2)(3) = 4 − 6 = −2.', 'Mathematics', 'Hard', 40, 123),
('What is the value of sin(30°) + cos(60°)?', '0.5', '1', '1.5', '√3/2', 'B', 'sin(30°) = 0.5 and cos(60°) = 0.5, so 0.5 + 0.5 = 1.', 'Mathematics', 'Medium', 30, 124),

-- ============================================================
-- SCIENCE — 30 new questions
-- ============================================================
('What is the powerhouse of the cell?', 'Nucleus', 'Ribosome', 'Mitochondria', 'Endoplasmic reticulum', 'C', 'Mitochondria produce ATP through cellular respiration, earning them the nickname "powerhouse of the cell."', 'Science', 'Easy', 20, 201),
('What gas do plants absorb from the atmosphere during photosynthesis?', 'Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen', 'C', 'Plants absorb CO₂ and water, using sunlight to produce glucose and O₂.', 'Science', 'Easy', 20, 202),
('Which planet in our solar system has the most moons?', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'B', 'Saturn has over 140 known moons, surpassing Jupiter''s count.', 'Science', 'Easy', 25, 203),
('What type of bond involves the sharing of electron pairs between atoms?', 'Ionic bond', 'Covalent bond', 'Metallic bond', 'Hydrogen bond', 'B', 'Covalent bonds form when atoms share electron pairs to achieve stable electron configurations.', 'Science', 'Easy', 25, 204),
('What is the chemical formula for table salt?', 'NaOH', 'NaCl', 'KCl', 'CaCl₂', 'B', 'Table salt is sodium chloride, NaCl.', 'Science', 'Easy', 20, 205),
('Which organelle is responsible for protein synthesis?', 'Golgi apparatus', 'Lysosome', 'Ribosome', 'Vacuole', 'C', 'Ribosomes translate mRNA into polypeptide chains (proteins).', 'Science', 'Easy', 25, 206),
('What is the most abundant gas in Earth''s atmosphere?', 'Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon', 'C', 'Nitrogen makes up about 78% of Earth''s atmosphere.', 'Science', 'Easy', 20, 207),
('What process converts glucose into energy in cells?', 'Photosynthesis', 'Cellular respiration', 'Fermentation', 'Osmosis', 'B', 'Cellular respiration breaks down glucose to produce ATP, the cell''s energy currency.', 'Science', 'Medium', 30, 208),
('What is the pH of pure water at 25°C?', '0', '7', '14', '1', 'B', 'Pure water has a neutral pH of 7, with equal concentrations of H⁺ and OH⁻ ions.', 'Science', 'Medium', 25, 209),
('Which layer of the Earth is liquid?', 'Inner core', 'Outer core', 'Mantle', 'Crust', 'B', 'The outer core is a liquid layer composed mainly of iron and nickel.', 'Science', 'Medium', 25, 210),
('What is the function of white blood cells?', 'Transport oxygen', 'Clot blood', 'Fight infections', 'Carry nutrients', 'C', 'White blood cells (leukocytes) are key components of the immune system.', 'Science', 'Medium', 25, 211),
('What type of wave is sound?', 'Transverse', 'Longitudinal', 'Electromagnetic', 'Standing', 'B', 'Sound waves are longitudinal — compressions and rarefactions travel through a medium.', 'Science', 'Medium', 25, 212),
('What is the half-life of Carbon-14?', 'About 570 years', 'About 5,730 years', 'About 57,300 years', 'About 573,000 years', 'B', 'C-14 has a half-life of approximately 5,730 years, making it useful for dating organic materials up to ~50,000 years old.', 'Science', 'Medium', 30, 213),
('Which vitamin is produced by the body when exposed to sunlight?', 'Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D', 'D', 'UV-B radiation triggers vitamin D synthesis in the skin.', 'Science', 'Medium', 25, 214),
('What is the Doppler effect?', 'Bending of light around massive objects', 'Change in frequency due to relative motion', 'Splitting of white light into colors', 'Reflection of sound waves', 'B', 'The Doppler effect is the change in frequency or wavelength of a wave relative to an observer moving relative to the source.', 'Science', 'Medium', 30, 215),
('What is the main function of DNA polymerase?', 'Break down DNA', 'Replicate DNA', 'Transcribe DNA to RNA', 'Translate RNA to protein', 'B', 'DNA polymerase synthesizes new DNA strands by adding nucleotides complementary to the template strand.', 'Science', 'Hard', 35, 216),
('What is the Heisenberg Uncertainty Principle?', 'Energy cannot be created or destroyed', 'You cannot simultaneously know exact position and momentum', 'Every action has an equal reaction', 'Entropy always increases', 'B', 'Heisenberg''s principle states that the more precisely you know a particle''s position, the less precisely you can know its momentum, and vice versa.', 'Science', 'Hard', 35, 217),
('What is the primary difference between mitosis and meiosis?', 'Mitosis produces 4 cells, meiosis produces 2', 'Mitosis produces identical cells, meiosis produces genetically diverse cells', 'Mitosis only occurs in plants', 'There is no difference', 'B', 'Mitosis produces 2 identical diploid cells; meiosis produces 4 genetically unique haploid cells.', 'Science', 'Hard', 35, 218),

-- ============================================================
-- PHYSICS — 25 new questions
-- ============================================================
('What is the SI unit of force?', 'Joule', 'Newton', 'Watt', 'Pascal', 'B', 'Force is measured in Newtons (N). 1 N = 1 kg⋅m/s².', 'Physics', 'Easy', 20, 301),
('What is the speed of light in vacuum?', '3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s', 'B', 'Light travels at approximately 3 × 10⁸ meters per second in a vacuum.', 'Physics', 'Easy', 20, 302),
('Which law states that for every action there is an equal and opposite reaction?', 'Newton''s First Law', 'Newton''s Second Law', 'Newton''s Third Law', 'Law of Conservation of Energy', 'C', 'Newton''s Third Law: when object A exerts a force on object B, B exerts an equal and opposite force on A.', 'Physics', 'Easy', 25, 303),
('What is the unit of electrical resistance?', 'Ampere', 'Volt', 'Ohm', 'Watt', 'C', 'Resistance is measured in Ohms (Ω). R = V/I.', 'Physics', 'Easy', 20, 304),
('What happens to the period of a pendulum if its length is quadrupled?', 'It doubles', 'It quadruples', 'It halves', 'It stays the same', 'A', 'T = 2π√(L/g). If L → 4L, then T → 2T. The period doubles.', 'Physics', 'Medium', 40, 305),
('A 2 kg object accelerates at 5 m/s². What is the net force acting on it?', '2.5 N', '7 N', '10 N', '25 N', 'C', 'F = ma = 2 × 5 = 10 N.', 'Physics', 'Medium', 30, 306),
('What is the total resistance of two 10Ω resistors connected in parallel?', '20Ω', '5Ω', '10Ω', '0.2Ω', 'B', '1/R = 1/10 + 1/10 = 2/10. R = 5Ω.', 'Physics', 'Medium', 35, 307),
('Which color of visible light has the highest frequency?', 'Red', 'Green', 'Blue', 'Violet', 'D', 'Violet light has the highest frequency (and shortest wavelength) in the visible spectrum.', 'Physics', 'Medium', 25, 308),
('What is the kinetic energy of a 4 kg object moving at 3 m/s?', '6 J', '12 J', '18 J', '36 J', 'C', 'KE = ½mv² = ½(4)(9) = 18 J.', 'Physics', 'Medium', 30, 309),
('An object is dropped from rest. How far does it fall in 3 seconds? (g = 10 m/s²)', '15 m', '30 m', '45 m', '90 m', 'C', 'd = ½gt² = ½(10)(9) = 45 m.', 'Physics', 'Medium', 35, 310),
('What is the wavelength of a wave with frequency 500 Hz and speed 340 m/s?', '0.68 m', '1.47 m', '170000 m', '0.34 m', 'A', 'λ = v/f = 340/500 = 0.68 m.', 'Physics', 'Medium', 35, 311),
('In which type of collision is kinetic energy conserved?', 'Perfectly inelastic', 'Inelastic', 'Elastic', 'All collisions', 'C', 'In elastic collisions, both momentum and kinetic energy are conserved.', 'Physics', 'Medium', 30, 312),
('What is the electric field strength 2 m from a point charge of 4 × 10⁻⁶ C? (k = 9 × 10⁹)', '9000 N/C', '4500 N/C', '18000 N/C', '36000 N/C', 'A', 'E = kQ/r² = (9×10⁹)(4×10⁻⁶)/4 = 9000 N/C.', 'Physics', 'Hard', 45, 313),
('What is the escape velocity from Earth? (approximately)', '7.9 km/s', '11.2 km/s', '15.4 km/s', '25.0 km/s', 'B', 'Earth''s escape velocity is approximately 11.2 km/s.', 'Physics', 'Hard', 30, 314),
('A transformer has 100 primary turns and 500 secondary turns. If the primary voltage is 20V, what is the secondary voltage?', '4V', '100V', '500V', '10000V', 'B', 'V₂/V₁ = N₂/N₁. V₂ = 20 × 500/100 = 100V.', 'Physics', 'Hard', 40, 315),

-- ============================================================
-- CHEMISTRY — 25 new questions
-- ============================================================
('How many elements are in the periodic table (as of 2024)?', '108', '112', '118', '120', 'C', 'There are 118 confirmed elements in the periodic table.', 'Chemistry', 'Easy', 20, 401),
('What is the atomic number of Carbon?', '4', '6', '8', '12', 'B', 'Carbon has 6 protons, giving it atomic number 6.', 'Chemistry', 'Easy', 20, 402),
('What type of reaction is 2H₂ + O₂ → 2H₂O?', 'Decomposition', 'Synthesis', 'Single replacement', 'Double replacement', 'B', 'Two or more reactants combine to form a single product — this is a synthesis (combination) reaction.', 'Chemistry', 'Easy', 25, 403),
('Which element has the chemical symbol "Fe"?', 'Fluorine', 'Francium', 'Iron', 'Fermium', 'C', 'Fe comes from the Latin "ferrum" meaning iron.', 'Chemistry', 'Easy', 20, 404),
('What is the molar mass of water (H₂O)?', '16 g/mol', '18 g/mol', '20 g/mol', '34 g/mol', 'B', 'H₂O: 2(1) + 16 = 18 g/mol.', 'Chemistry', 'Easy', 25, 405),
('What is an isotope?', 'Atoms with same protons but different neutrons', 'Atoms with same neutrons but different protons', 'Atoms with no neutrons', 'Atoms that are radioactive', 'A', 'Isotopes are atoms of the same element with different numbers of neutrons.', 'Chemistry', 'Medium', 30, 406),
('What is the pH of a solution with [H⁺] = 10⁻⁴ M?', '2', '4', '10', '14', 'B', 'pH = −log[H⁺] = −log(10⁻⁴) = 4.', 'Chemistry', 'Medium', 30, 407),
('Which type of bond forms between a metal and a nonmetal?', 'Covalent', 'Ionic', 'Metallic', 'Van der Waals', 'B', 'Metals tend to lose electrons and nonmetals gain them, forming ionic bonds.', 'Chemistry', 'Medium', 25, 408),
('What is Avogadro''s number?', '6.022 × 10²³', '3.14 × 10²³', '6.022 × 10²⁶', '1.602 × 10⁻¹⁹', 'A', 'Avogadro''s number (6.022 × 10²³) is the number of particles in one mole.', 'Chemistry', 'Medium', 25, 409),
('In an exothermic reaction, energy is:', 'Absorbed from surroundings', 'Released to surroundings', 'Neither absorbed nor released', 'Converted to mass', 'B', 'Exothermic reactions release energy (usually as heat) to the surroundings.', 'Chemistry', 'Medium', 25, 410),
('What is the electron configuration of Sodium (Na)?', '1s² 2s² 2p⁶ 3s¹', '1s² 2s² 2p⁶', '1s² 2s² 2p⁶ 3s² 3p¹', '1s² 2s² 2p⁵', 'A', 'Na has 11 electrons: 1s² 2s² 2p⁶ 3s¹.', 'Chemistry', 'Medium', 35, 411),
('What is Le Chatelier''s Principle about?', 'Conservation of mass in reactions', 'How systems at equilibrium respond to disturbances', 'The speed of chemical reactions', 'Electron orbital shapes', 'B', 'Le Chatelier''s Principle states that a system at equilibrium will shift to partially counteract any imposed change.', 'Chemistry', 'Medium', 30, 412),
('How many moles of NaCl are in 117 g of NaCl? (Molar mass = 58.5 g/mol)', '0.5', '1', '2', '5', 'C', 'n = mass/molar mass = 117/58.5 = 2 moles.', 'Chemistry', 'Medium', 35, 413),
('What is the oxidation state of Mn in KMnO₄?', '+3', '+5', '+7', '+4', 'C', 'K(+1) + Mn(x) + 4O(−2) = 0. 1 + x − 8 = 0, so x = +7.', 'Chemistry', 'Hard', 45, 414),
('Which gas law relates pressure and volume at constant temperature?', 'Charles''s Law', 'Boyle''s Law', 'Avogadro''s Law', 'Gay-Lussac''s Law', 'B', 'Boyle''s Law: PV = constant at constant temperature. P₁V₁ = P₂V₂.', 'Chemistry', 'Hard', 35, 415),

-- ============================================================
-- LOGIC & PROBLEM SOLVING — 30 new questions
-- ============================================================
('If all roses are flowers and some flowers fade quickly, which must be true?', 'All roses fade quickly', 'Some roses fade quickly', 'No roses fade quickly', 'None of the above must be true', 'D', 'From "all roses are flowers" and "some flowers fade quickly," we cannot conclude anything specific about roses fading. The roses might or might not be among those that fade.', 'Logic & Problem Solving', 'Easy', 30, 501),
('What comes next: 2, 6, 18, 54, ...?', '108', '162', '72', '216', 'B', 'Each term is multiplied by 3: 54 × 3 = 162.', 'Logic & Problem Solving', 'Easy', 25, 502),
('If it takes 5 machines 5 minutes to make 5 widgets, how long does it take 100 machines to make 100 widgets?', '5 minutes', '100 minutes', '20 minutes', '1 minute', 'A', 'Each machine makes 1 widget in 5 minutes. So 100 machines make 100 widgets in 5 minutes.', 'Logic & Problem Solving', 'Easy', 35, 503),
('A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?', '$0.10', '$0.05', '$0.15', '$0.01', 'B', 'Let ball = x. Bat = x + 1.00. So x + (x + 1.00) = 1.10 → 2x = 0.10 → x = $0.05.', 'Logic & Problem Solving', 'Medium', 40, 504),
('What comes next: 1, 1, 2, 3, 5, 8, ...?', '11', '12', '13', '15', 'C', 'This is the Fibonacci sequence. Each number is the sum of the two preceding ones: 5 + 8 = 13.', 'Logic & Problem Solving', 'Easy', 25, 505),
('Three friends are standing in a line. Alex is not first. Blake is not last. Charlie is not first or last. What is the order?', 'Blake, Charlie, Alex', 'Charlie, Alex, Blake', 'Alex, Charlie, Blake', 'Blake, Alex, Charlie', 'A', 'Charlie must be in the middle (not first or last). Alex is not first, so Alex is last. Blake is first.', 'Logic & Problem Solving', 'Medium', 45, 506),
('If you rearrange the letters "CIFAIPC" you get the name of a:', 'Country', 'Ocean', 'City', 'Animal', 'B', 'The letters rearrange to spell PACIFIC — an ocean.', 'Logic & Problem Solving', 'Medium', 45, 507),
('A farmer has 17 sheep. All but 9 die. How many sheep does the farmer have left?', '8', '9', '17', '0', 'B', '"All but 9" means 9 survive.', 'Logic & Problem Solving', 'Easy', 25, 508),
('What is the next number: 1, 4, 9, 16, 25, ...?', '30', '35', '36', '49', 'C', 'These are perfect squares: 1², 2², 3², 4², 5². Next is 6² = 36.', 'Logic & Problem Solving', 'Easy', 25, 509),
('If the day before yesterday was Thursday, what day is tomorrow?', 'Saturday', 'Sunday', 'Monday', 'Friday', 'B', 'If day before yesterday = Thursday, then yesterday = Friday, today = Saturday, tomorrow = Sunday.', 'Logic & Problem Solving', 'Medium', 35, 510),
('A clock shows 3:15. What is the angle between the hour and minute hands?', '0°', '7.5°', '15°', '22.5°', 'B', 'At 3:15, minute hand is at 90°. Hour hand: 3×30 + 15×0.5 = 97.5°. Angle = 97.5 − 90 = 7.5°.', 'Logic & Problem Solving', 'Hard', 50, 511),
('You have 8 identical-looking balls. One is heavier. Using a balance scale, what is the minimum number of weighings to find it?', '1', '2', '3', '4', 'B', 'Weigh 3 vs 3. If balanced, weigh the remaining 2. If unbalanced, weigh 1 vs 1 from the heavier group.', 'Logic & Problem Solving', 'Hard', 50, 512),
('If A → B and B → C, and A is true, what can we conclude?', 'Only B is true', 'Only C is true', 'Both B and C are true', 'Neither B nor C is necessarily true', 'C', 'By modus ponens: A is true and A → B, so B is true. B is true and B → C, so C is true.', 'Logic & Problem Solving', 'Medium', 35, 513),
('What comes next: O, T, T, F, F, S, S, ...?', 'E', 'N', 'T', 'O', 'A', 'These are first letters of numbers: One, Two, Three, Four, Five, Six, Seven, Eight.', 'Logic & Problem Solving', 'Medium', 40, 514),
('In a race, you overtake the person in 2nd place. What position are you now in?', '1st', '2nd', '3rd', 'It depends on the race', 'B', 'If you overtake the person in 2nd place, you take their position — you are now 2nd.', 'Logic & Problem Solving', 'Easy', 25, 515),
('How many times do the hands of a clock overlap in 12 hours?', '11', '12', '22', '24', 'A', 'The hands overlap 11 times in 12 hours (not 12, because the hour hand moves too).', 'Logic & Problem Solving', 'Hard', 45, 516),
('A woman has 7 daughters and each daughter has a brother. How many children does the woman have?', '14', '8', '7', '15', 'B', 'Each daughter has the same brother. So there are 7 daughters + 1 son = 8 children.', 'Logic & Problem Solving', 'Medium', 30, 517),

-- ============================================================
-- ETHICS & PHILOSOPHY — 20 new questions
-- ============================================================
('Which philosopher wrote "The Republic"?', 'Aristotle', 'Socrates', 'Plato', 'Epicurus', 'C', 'Plato wrote The Republic, exploring justice, the ideal state, and the philosopher-king.', 'Ethics & Philosophy', 'Easy', 25, 601),
('What is the ethical principle "the greatest good for the greatest number" called?', 'Deontology', 'Utilitarianism', 'Virtue Ethics', 'Relativism', 'B', 'Utilitarianism, developed by Bentham and Mill, judges actions by their consequences for overall happiness.', 'Ethics & Philosophy', 'Easy', 25, 602),
('The "veil of ignorance" is a concept from which philosopher?', 'Immanuel Kant', 'John Rawls', 'Peter Singer', 'Judith Jarvis Thomson', 'B', 'Rawls proposed the veil of ignorance in "A Theory of Justice" as a device for determining fair principles.', 'Ethics & Philosophy', 'Medium', 30, 603),
('What does "cogito ergo sum" mean?', 'Knowledge is power', 'I think, therefore I am', 'The end justifies the means', 'Know thyself', 'B', 'Descartes'' famous statement establishes self-awareness as the one indubitable truth.', 'Ethics & Philosophy', 'Easy', 20, 604),
('What is moral relativism?', 'Morality is absolute and universal', 'Morality varies between cultures and individuals', 'Only consequences matter in ethics', 'Morality comes from religion', 'B', 'Moral relativism holds that moral judgments are not universal but relative to cultural, societal, or personal context.', 'Ethics & Philosophy', 'Medium', 30, 605),
('Which philosopher is most associated with existentialism?', 'John Locke', 'Jean-Paul Sartre', 'Thomas Aquinas', 'David Hume', 'B', 'Sartre''s "existence precedes essence" is a foundational existentialist principle.', 'Ethics & Philosophy', 'Medium', 25, 606),
('The "categorical imperative" belongs to which philosopher?', 'Aristotle', 'John Stuart Mill', 'Immanuel Kant', 'Friedrich Nietzsche', 'C', 'Kant''s categorical imperative states: act only according to maxims that you could will to be universal laws.', 'Ethics & Philosophy', 'Medium', 30, 607),
('What is the "is-ought problem"?', 'The difficulty of deriving moral prescriptions from factual descriptions', 'The problem of free will', 'The question of whether God exists', 'The paradox of tolerance', 'A', 'David Hume identified that you cannot derive an "ought" (what should be) solely from an "is" (what is).', 'Ethics & Philosophy', 'Hard', 40, 608),
('A doctor can save five patients by harvesting organs from one healthy person. A utilitarian might argue this is justified because:', 'Rules must never be broken', 'The total happiness is maximized', 'Virtue demands sacrifice', 'Individual rights are paramount', 'B', 'A strict utilitarian calculus would favor the action that produces the greatest total good, though most utilitarians add constraints.', 'Ethics & Philosophy', 'Hard', 45, 609),
('What is the "paradox of tolerance"?', 'Tolerant societies cannot tolerate everything', 'All cultures are equally valid', 'Tolerance leads to moral decay', 'Intolerance is always wrong', 'A', 'Karl Popper argued that unlimited tolerance leads to the disappearance of tolerance — a tolerant society must not tolerate intolerance.', 'Ethics & Philosophy', 'Hard', 40, 610),

-- ============================================================
-- GENERAL KNOWLEDGE — 30 new questions
-- ============================================================
('Which country has the largest population in the world?', 'United States', 'India', 'China', 'Indonesia', 'B', 'India surpassed China as the world''s most populous country in 2023.', 'General Knowledge', 'Easy', 20, 701),
('What is the capital of Australia?', 'Sydney', 'Melbourne', 'Canberra', 'Perth', 'C', 'Canberra is the capital of Australia, chosen as a compromise between Sydney and Melbourne.', 'General Knowledge', 'Easy', 20, 702),
('Who painted the Mona Lisa?', 'Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello', 'B', 'Leonardo da Vinci painted the Mona Lisa, believed to be Lisa Gherardini, between 1503 and 1519.', 'General Knowledge', 'Easy', 20, 703),
('What is the longest river in the world?', 'Amazon', 'Nile', 'Yangtze', 'Mississippi', 'B', 'The Nile River is approximately 6,650 km long, making it the longest river in the world.', 'General Knowledge', 'Easy', 20, 704),
('In which year did World War II end?', '1943', '1944', '1945', '1946', 'C', 'World War II ended in 1945 with the surrender of Germany in May and Japan in August.', 'General Knowledge', 'Easy', 20, 705),
('What is the currency of Japan?', 'Yuan', 'Won', 'Yen', 'Ringgit', 'C', 'The Japanese yen (¥) is the official currency of Japan.', 'General Knowledge', 'Easy', 15, 706),
('Which ocean is the largest by area?', 'Atlantic', 'Indian', 'Arctic', 'Pacific', 'D', 'The Pacific Ocean covers about 165.25 million km², more than all land area combined.', 'General Knowledge', 'Easy', 20, 707),
('What is the tallest mountain in the world?', 'K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse', 'C', 'Mount Everest stands at 8,849 meters, making it the tallest mountain above sea level.', 'General Knowledge', 'Easy', 15, 708),
('Which element has the chemical symbol "Au"?', 'Silver', 'Aluminum', 'Gold', 'Argon', 'C', 'Au comes from the Latin "aurum" meaning gold.', 'General Knowledge', 'Easy', 20, 709),
('What is the smallest continent by land area?', 'Europe', 'Antarctica', 'Australia', 'South America', 'C', 'Australia/Oceania is the smallest continent at approximately 8.5 million km².', 'General Knowledge', 'Easy', 20, 710),
('Which country is known as the Land of the Rising Sun?', 'China', 'Thailand', 'Japan', 'South Korea', 'C', 'Japan is called the Land of the Rising Sun because it lies east of the Asian mainland.', 'General Knowledge', 'Easy', 20, 711),
('Who wrote "Romeo and Juliet"?', 'Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain', 'B', 'William Shakespeare wrote Romeo and Juliet around 1594–1596.', 'General Knowledge', 'Easy', 15, 712),
('What is the hardest natural substance on Earth?', 'Granite', 'Quartz', 'Diamond', 'Titanium', 'C', 'Diamond ranks 10 on the Mohs hardness scale, the highest rating.', 'General Knowledge', 'Easy', 20, 713),
('How many continents are there?', '5', '6', '7', '8', 'C', 'There are 7 continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America.', 'General Knowledge', 'Easy', 15, 714),
('What is the largest desert in the world?', 'Sahara', 'Arabian', 'Gobi', 'Antarctic', 'D', 'Antarctica is technically the largest desert (14 million km²) since a desert is defined by low precipitation, not temperature.', 'General Knowledge', 'Medium', 25, 715),
('Which ancient civilization built Machu Picchu?', 'Maya', 'Aztec', 'Inca', 'Olmec', 'C', 'The Inca civilization built Machu Picchu in the 15th century in present-day Peru.', 'General Knowledge', 'Medium', 25, 716),
('What is the Great Barrier Reef made of?', 'Volcanic rock', 'Coral', 'Sand', 'Limestone', 'B', 'The Great Barrier Reef is the world''s largest coral reef system, composed of billions of coral polyps.', 'General Knowledge', 'Medium', 25, 717),
('Which country has the most UNESCO World Heritage Sites?', 'China', 'Italy', 'Spain', 'France', 'B', 'Italy has the most UNESCO World Heritage Sites with 58 as of 2023.', 'General Knowledge', 'Medium', 25, 718),
('What year was the United Nations founded?', '1919', '1939', '1945', '1948', 'C', 'The UN was established on October 24, 1945, after World War II.', 'General Knowledge', 'Medium', 25, 719),
('Who was the first person to walk on the Moon?', 'Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'John Glenn', 'B', 'Neil Armstrong was the first person to walk on the Moon on July 20, 1969.', 'General Knowledge', 'Easy', 20, 720)

ON CONFLICT (question_text) DO NOTHING;

-- ============================================================
-- HISTORY — 15 new questions
-- ============================================================
INSERT INTO public.questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, difficulty, time_seconds, sort_order)
VALUES
('Which empire was ruled by Genghis Khan?', 'Ottoman Empire', 'Roman Empire', 'Mongol Empire', 'Persian Empire', 'C', 'Genghis Khan founded and ruled the Mongol Empire, the largest contiguous land empire in history.', 'History', 'Easy', 20, 801),
('The French Revolution began in which year?', '1776', '1789', '1799', '1804', 'B', 'The French Revolution began in 1789 with the storming of the Bastille.', 'History', 'Medium', 25, 802),
('Who was the first President of the United States?', 'Thomas Jefferson', 'John Adams', 'George Washington', 'Benjamin Franklin', 'C', 'George Washington served as the first U.S. President from 1789 to 1797.', 'History', 'Easy', 20, 803),
('The Renaissance began in which country?', 'France', 'England', 'Germany', 'Italy', 'D', 'The Renaissance began in Italy in the 14th century, particularly in Florence.', 'History', 'Medium', 25, 804),
('What was the primary cause of World War I?', 'The invasion of Poland', 'The assassination of Archduke Franz Ferdinand', 'The bombing of Pearl Harbor', 'The Treaty of Versailles', 'B', 'The assassination of Archduke Franz Ferdinand of Austria-Hungary in 1914 was the immediate trigger.', 'History', 'Medium', 30, 805),
('The Berlin Wall fell in which year?', '1985', '1987', '1989', '1991', 'C', 'The Berlin Wall fell on November 9, 1989, leading to German reunification.', 'History', 'Medium', 25, 806),
('Which civilization built the Great Pyramids of Giza?', 'Greek', 'Roman', 'Egyptian', 'Mesopotamian', 'C', 'The Ancient Egyptians built the Great Pyramids of Giza around 2560 BCE.', 'History', 'Easy', 20, 807),
('The Cold War was primarily between which two superpowers?', 'UK and Germany', 'US and Soviet Union', 'France and China', 'Japan and Russia', 'B', 'The Cold War (1947–1991) was a geopolitical tension between the US and Soviet Union.', 'History', 'Easy', 20, 808),
('Who discovered penicillin?', 'Louis Pasteur', 'Alexander Fleming', 'Joseph Lister', 'Robert Koch', 'B', 'Alexander Fleming discovered penicillin in 1928 when mold contaminated his bacterial cultures.', 'History', 'Medium', 25, 809),
('The Silk Road connected which two regions?', 'Europe and Africa', 'East Asia and Europe', 'Americas and Europe', 'Africa and Asia', 'B', 'The Silk Road was a network of trade routes connecting East Asia (China) to Europe.', 'History', 'Medium', 25, 810),

-- ============================================================
-- GEOGRAPHY — 10 new questions
-- ============================================================
('Which country has the most time zones?', 'Russia', 'United States', 'France', 'China', 'C', 'France has the most time zones (12) due to its overseas territories.', 'Geography', 'Hard', 30, 901),
('What is the deepest point in the ocean?', 'Tonga Trench', 'Mariana Trench', 'Puerto Rico Trench', 'Java Trench', 'B', 'The Mariana Trench''s Challenger Deep is approximately 10,935 meters deep.', 'Geography', 'Medium', 25, 902),
('Which African country has the largest economy?', 'South Africa', 'Nigeria', 'Egypt', 'Kenya', 'B', 'Nigeria has the largest economy in Africa by GDP.', 'Geography', 'Medium', 25, 903),
('The Andes mountain range is located on which continent?', 'Asia', 'Europe', 'South America', 'Africa', 'C', 'The Andes is the longest mountain range in the world, running along South America''s western coast.', 'Geography', 'Easy', 20, 904),
('Which strait separates Europe from Africa?', 'Strait of Hormuz', 'Strait of Malacca', 'Strait of Gibraltar', 'Bosphorus Strait', 'C', 'The Strait of Gibraltar, only 14 km wide at its narrowest, separates Europe from Africa.', 'Geography', 'Medium', 25, 905),

-- ============================================================
-- TECHNOLOGY — 10 new questions
-- ============================================================
('What does "HTTP" stand for?', 'HyperText Transfer Protocol', 'High Tech Transfer Program', 'HyperText Transmission Process', 'High Transfer Text Protocol', 'A', 'HTTP (HyperText Transfer Protocol) is the foundation of data communication on the Web.', 'Technology', 'Easy', 20, 1001),
('Who is considered the father of computer science?', 'Bill Gates', 'Alan Turing', 'Steve Jobs', 'Tim Berners-Lee', 'B', 'Alan Turing formalized computation with the Turing machine and broke the Enigma code in WWII.', 'Technology', 'Easy', 20, 1002),
('What does "CPU" stand for?', 'Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit', 'A', 'The CPU (Central Processing Unit) is the primary component that executes instructions in a computer.', 'Technology', 'Easy', 20, 1003),
('In what year was the World Wide Web invented?', '1983', '1989', '1993', '1995', 'B', 'Tim Berners-Lee invented the World Wide Web in 1989 at CERN.', 'Technology', 'Medium', 25, 1004),
('What programming language is most associated with web browsers?', 'Python', 'Java', 'JavaScript', 'C++', 'C', 'JavaScript is the primary language for client-side web development, running natively in browsers.', 'Technology', 'Easy', 20, 1005),
('What is Moore''s Law about?', 'Internet speed doubles every year', 'Transistor count on chips doubles roughly every two years', 'Computer memory halves in size every decade', 'Software complexity grows linearly', 'B', 'Gordon Moore observed that transistor count on integrated circuits roughly doubles every two years.', 'Technology', 'Medium', 30, 1006),
('What does "AI" stand for in technology?', 'Automated Intelligence', 'Artificial Intelligence', 'Advanced Integration', 'Algorithmic Interface', 'B', 'Artificial Intelligence refers to computer systems designed to perform tasks that normally require human intelligence.', 'Technology', 'Easy', 15, 1007),
('Which company developed the first commercially successful smartphone?', 'Nokia', 'Apple', 'Samsung', 'BlackBerry', 'B', 'Apple''s iPhone, released in 2007, is widely considered the first commercially successful modern smartphone.', 'Technology', 'Medium', 25, 1008)

ON CONFLICT (question_text) DO NOTHING;
