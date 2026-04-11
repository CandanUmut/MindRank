export type CategoryName =
  | 'General Knowledge'
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Logic & Problem Solving'
  | 'Ethics & Philosophy'
  | 'Science'

export type PerformanceTier =
  | 'Exceptional'
  | 'Strong'
  | 'Solid'
  | 'Developing'
  | 'Emerging'

export interface CategoryPerformance {
  category: string
  correct: number
  total: number
  percentage: number
  rating: PerformanceTier
}

export interface AnswerWithQuestion {
  number: number
  question: {
    id: string
    question_text: string
    correct_answer: 'A' | 'B' | 'C' | 'D'
    explanation: string
    category: string
    difficulty: string
    option_a: string
    option_b: string
    option_c: string
    option_d: string
  } | null
  selected_answer: 'A' | 'B' | 'C' | 'D' | null
  is_correct: boolean
  time_taken_ms: number | null
}

/** Maps a percentage score to a qualitative tier. */
export function getPerformanceTier(percentile: number): PerformanceTier {
  if (percentile >= 90) return 'Exceptional'
  if (percentile >= 75) return 'Strong'
  if (percentile >= 50) return 'Solid'
  if (percentile >= 25) return 'Developing'
  return 'Emerging'
}

/** Returns a rating label based on category percentage correct. */
export function getCategoryRating(percentage: number): PerformanceTier {
  if (percentage >= 90) return 'Exceptional'
  if (percentage >= 75) return 'Strong'
  if (percentage >= 50) return 'Solid'
  if (percentage >= 25) return 'Developing'
  return 'Emerging'
}

/** Aggregates per-question answers into per-category stats. */
export function computeCategoryPerformance(
  answers: AnswerWithQuestion[]
): CategoryPerformance[] {
  const map: Record<string, { correct: number; total: number }> = {}

  for (const a of answers) {
    const cat = a.question?.category
    if (!cat) continue
    if (!map[cat]) map[cat] = { correct: 0, total: 0 }
    map[cat].total++
    if (a.is_correct) map[cat].correct++
  }

  return Object.entries(map).map(([category, stats]) => {
    const percentage =
      stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    return {
      category,
      correct: stats.correct,
      total: stats.total,
      percentage,
      rating: getCategoryRating(percentage),
    }
  })
}

/** Returns the text of the given option key (A–D) from a question row. */
export function getOptionText(
  question: { option_a: string; option_b: string; option_c: string; option_d: string },
  key: 'A' | 'B' | 'C' | 'D' | null
): string {
  if (!key) return '—'
  const map = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  }
  return map[key]
}

/** Formats a seconds value as MM:SS. */
export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/** Returns an ordinal suffix string, e.g. 1 → "1st", 42 → "42nd". */
export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
