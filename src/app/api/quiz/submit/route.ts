import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Grace period covers drift between `server_started_at` (set at session
// creation, before the client has received the questions and started its local
// Timer) and the moment the submit request actually reaches the server. In
// practice this gap can be several seconds (session creation → response →
// render → Timer mount → submit round-trip), so a generous buffer is needed
// to avoid wrongly marking legit finishes as timed_out.
const GRACE_PERIOD_SECONDS = 15

type SessionRow = {
  id: string
  status: string
  server_started_at: string
  max_possible_score: number
  quiz_type_id: string | null
  question_order: string[]
}

type QuizTypeRow = {
  time_limit_seconds: number
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { session_id: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id } = body
  if (!session_id) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  }

  const sessionResult = await supabase
    .from('quiz_sessions')
    .select('id, status, server_started_at, max_possible_score, quiz_type_id, question_order')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  const session = sessionResult.data as SessionRow | null

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status !== 'in_progress') {
    return NextResponse.json({ success: true })
  }

  // Get time limit from quiz type, or default to 25 minutes
  let timeLimitSeconds = 25 * 60
  if (session.quiz_type_id) {
    const { data: qt } = await supabase
      .from('quiz_types')
      .select('time_limit_seconds')
      .eq('id', session.quiz_type_id)
      .single()
    if (qt) {
      timeLimitSeconds = (qt as QuizTypeRow).time_limit_seconds
    }
  }

  const now = new Date()
  const started = new Date(session.server_started_at)
  const elapsedSeconds = (now.getTime() - started.getTime()) / 1000

  // Fetch both the total answered count and the correct count in parallel.
  // The total count is the authoritative signal for "did the user finish?".
  const [answeredResult, correctResult] = await Promise.all([
    supabase
      .from('user_answers')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id),
    supabase
      .from('user_answers')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id)
      .eq('is_correct', true),
  ])

  if (answeredResult.error || correctResult.error) {
    console.error('[submit count]', answeredResult.error ?? correctResult.error)
    return NextResponse.json({ error: 'Failed to calculate score' }, { status: 500 })
  }

  const totalQuestions = (session.question_order ?? []).length
  const answeredCount = answeredResult.count ?? 0
  const allAnswered = totalQuestions > 0 && answeredCount >= totalQuestions

  // Status rules:
  //   1. If the user actually answered every question, the quiz is completed —
  //      regardless of wall-clock drift between server_started_at and the
  //      client-side Timer. This is the ground-truth signal for "finished".
  //   2. Otherwise, fall back to the wall-clock check for forced auto-submits
  //      (timer ran out with unanswered questions).
  const status: 'completed' | 'timed_out' = allAnswered
    ? 'completed'
    : elapsedSeconds > timeLimitSeconds + GRACE_PERIOD_SECONDS
      ? 'timed_out'
      : 'completed'

  const score = correctResult.count ?? 0
  const maxScore = session.max_possible_score
  const percentage = parseFloat(((score / maxScore) * 100).toFixed(2))
  const timeSpentSeconds = Math.round(elapsedSeconds)

  const { error: updateError } = await supabase
    .from('quiz_sessions')
    // @ts-expect-error – postgrest-js resolves Update arg to never when Database generics
    // don't fully satisfy GenericSchema; runtime values are correct.
    .update({
      status,
      score,
      percentage,
      time_spent_seconds: timeSpentSeconds,
      finished_at: now.toISOString(),
      server_finished_at: now.toISOString(),
    })
    .eq('id', session_id)

  if (updateError) {
    console.error('[submit update]', updateError)
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
  }

  // Refresh legacy leaderboard for backward compat
  await supabase.rpc('refresh_leaderboard')

  return NextResponse.json({ success: true, status })
}
