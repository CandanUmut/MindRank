import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeCategoryPerformance } from '@/lib/utils/scoring'
import type { AnswerWithQuestion } from '@/lib/utils/scoring'

type SessionRow = {
  id: string
  score: number
  max_possible_score: number
  percentage: number | null
  time_spent_seconds: number | null
  status: string
  question_order: string[]
}

type AnswerRow = {
  question_id: string
  selected_answer: 'A' | 'B' | 'C' | 'D' | null
  is_correct: boolean | null
  time_taken_ms: number | null
  questions: {
    id: string
    question_text: string
    option_a: string
    option_b: string
    option_c: string
    option_d: string
    correct_answer: 'A' | 'B' | 'C' | 'D'
    explanation: string
    category: string
    difficulty: string
  } | null
}

type RankingRow = {
  my_score: number
  my_rank: number
  my_percentile: number
  total_participants: number
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the user's completed session.
  const sessionResult = await supabase
    .from('quiz_sessions')
    .select(
      'id, score, max_possible_score, percentage, time_spent_seconds, status, question_order'
    )
    .eq('user_id', user.id)
    .in('status', ['completed', 'timed_out'])
    .single()

  const session = sessionResult.data as SessionRow | null

  if (!session) {
    return NextResponse.json({ error: 'No completed session found' }, { status: 404 })
  }

  // Fetch answers joined with question data (including correct_answer for post-quiz review).
  const answersResult = await supabase
    .from('user_answers')
    .select(
      `
      question_id,
      selected_answer,
      is_correct,
      time_taken_ms,
      questions (
        id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation,
        category,
        difficulty
      )
    `
    )
    .eq('session_id', session.id)

  const answers = answersResult.data as AnswerRow[] | null

  const questionOrder = session.question_order as string[]

  // Build ordered answer list, filling in nulls for unanswered questions.
  const answerMap = new Map(
    (answers ?? []).map((a) => [a.question_id, a])
  )

  const orderedAnswers: AnswerWithQuestion[] = questionOrder.map((qId, idx) => {
    const a = answerMap.get(qId)
    return {
      number: idx + 1,
      question: a?.questions ?? null,
      selected_answer: a?.selected_answer ?? null,
      is_correct: a?.is_correct ?? false,
      time_taken_ms: a?.time_taken_ms ?? null,
    }
  })

  const categoryPerformance = computeCategoryPerformance(orderedAnswers)

  // Fetch ranking (may be empty if leaderboard not yet populated).
  const rankingResult = await supabase.rpc('get_my_ranking')
  const rankingRows = rankingResult.data as RankingRow[] | null
  const ranking = rankingRows && rankingRows.length > 0 ? rankingRows[0] : null

  return NextResponse.json({
    session: {
      id: session.id,
      score: session.score,
      max_score: session.max_possible_score,
      percentage: session.percentage ?? 0,
      time_spent_seconds: session.time_spent_seconds ?? 0,
      status: session.status,
    },
    answers: orderedAnswers,
    category_performance: categoryPerformance,
    ranking,
  })
}
