import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TIME_LIMIT_SECONDS = 25 * 60   // 25 minutes
const GRACE_PERIOD_SECONDS = 5        // 5-second network grace

type SessionRow = {
  id: string
  status: string
  server_started_at: string
  max_possible_score: number
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

  // Fetch the session.
  const sessionResult = await supabase
    .from('quiz_sessions')
    .select('id, status, server_started_at, max_possible_score')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  const session = sessionResult.data as SessionRow | null

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status !== 'in_progress') {
    // Already submitted – idempotent response.
    return NextResponse.json({ success: true })
  }

  // Server-side time validation.
  const now = new Date()
  const started = new Date(session.server_started_at)
  const elapsedSeconds = (now.getTime() - started.getTime()) / 1000
  const status: 'completed' | 'timed_out' =
    elapsedSeconds > TIME_LIMIT_SECONDS + GRACE_PERIOD_SECONDS
      ? 'timed_out'
      : 'completed'

  // Count correct answers.
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

  // Update the session.
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

  // Refresh the leaderboard so ranking is immediately available.
  await supabase.rpc('refresh_leaderboard')

  return NextResponse.json({ success: true, status })
}
