import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GRACE_PERIOD_SECONDS = 5

type SessionRow = {
  id: string
  status: string
  server_started_at: string
  max_possible_score: number
  quiz_type_id: string | null
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
    .select('id, status, server_started_at, max_possible_score, quiz_type_id')
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
  const status: 'completed' | 'timed_out' =
    elapsedSeconds > timeLimitSeconds + GRACE_PERIOD_SECONDS
      ? 'timed_out'
      : 'completed'

  const { count: correctCount, error: countError } = await supabase
    .from('user_answers')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session_id)
    .eq('is_correct', true)

  if (countError) {
    console.error('[submit count]', countError)
    return NextResponse.json({ error: 'Failed to calculate score' }, { status: 500 })
  }

  const score = correctCount ?? 0
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
