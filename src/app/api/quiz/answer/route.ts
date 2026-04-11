import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AnswerPayload {
  session_id: string
  question_id: string
  // The DISPLAY label the user selected (A/B/C/D as shown on screen).
  // The server maps this to the original option key using answer_order.
  selected_answer: 'A' | 'B' | 'C' | 'D'
  time_taken_ms: number
}

type SessionRow = {
  id: string
  status: string
  answer_order: Record<string, string[]>
  question_order: string[]
}

type QuestionRow = {
  correct_answer: 'A' | 'B' | 'C' | 'D'
}

const VALID_LABELS = new Set(['A', 'B', 'C', 'D'])

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: AnswerPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id, question_id, selected_answer, time_taken_ms } = body

  if (!session_id || !question_id || !VALID_LABELS.has(selected_answer)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  // Validate the session belongs to this user and is in progress.
  const sessionResult = await supabase
    .from('quiz_sessions')
    .select('id, status, answer_order, question_order')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  const session = sessionResult.data as SessionRow | null

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status !== 'in_progress') {
    return NextResponse.json({ error: 'Session is not in progress' }, { status: 409 })
  }

  // Map display label → original option key using the stored answer_order.
  const answerOrder = session.answer_order as Record<string, string[]>
  const displayLabels = ['A', 'B', 'C', 'D']
  const displayIndex = displayLabels.indexOf(selected_answer)
  const shuffle = answerOrder[question_id] ?? displayLabels
  const originalKey = (shuffle[displayIndex] ?? selected_answer) as
    | 'A'
    | 'B'
    | 'C'
    | 'D'

  // Fetch the correct answer (server-side only, never exposed to client).
  const questionResult = await supabase
    .from('questions')
    .select('correct_answer')
    .eq('id', question_id)
    .single()

  const question = questionResult.data as QuestionRow | null

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  const isCorrect = question.correct_answer === originalKey

  // Insert the answer – ignore duplicate (user already answered this question).
  // @ts-expect-error – postgrest-js resolves Insert arg to never when Database generics
  // don't fully satisfy GenericSchema; runtime values are correct.
  const { error: insertError } = await supabase.from('user_answers').insert({
    session_id,
    question_id,
    selected_answer: originalKey,
    is_correct: isCorrect,
    time_taken_ms: typeof time_taken_ms === 'number' ? time_taken_ms : null,
  })

  if (insertError) {
    // 23505 = unique_violation – question already answered, treat as idempotent.
    if (insertError.code !== '23505') {
      console.error('[answer insert]', insertError)
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
    }
  }

  // Determine if this was the last question.
  const questionOrder = session.question_order as string[]
  const { count: answeredCount } = await supabase
    .from('user_answers')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session_id)

  const isLast = (answeredCount ?? 0) >= questionOrder.length

  return NextResponse.json({ is_last: isLast })
}
