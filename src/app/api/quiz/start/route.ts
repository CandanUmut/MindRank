import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Local shapes for query results – avoids fighting Supabase type-inference
// on complex JSONB column selections.
type SessionRow = {
  question_order: string[]
  answer_order: Record<string, string[]>
}

type QuestionRow = {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  category: string
  difficulty: string
  time_seconds: number
}

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // start_quiz_session() creates a new session or resumes an in_progress one.
  // It raises 'already_completed' when the user has a finished session.
  const { data: sessionId, error: rpcError } = await supabase.rpc(
    'start_quiz_session'
  )

  if (rpcError) {
    const msg = rpcError.message ?? ''
    if (msg.includes('already_completed')) {
      return NextResponse.json({ error: 'already_completed' }, { status: 409 })
    }
    console.error('[start_quiz_session]', rpcError)
    return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 })
  }

  // Fetch the session to read question_order and answer_order.
  const sessionResult = await supabase
    .from('quiz_sessions')
    .select('question_order, answer_order')
    .eq('id', sessionId as string)
    .single()

  const session = sessionResult.data as SessionRow | null

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 500 })
  }

  const questionIds = session.question_order as string[]
  const answerOrder = session.answer_order as Record<string, string[]>

  // Fetch all active questions (without correct_answer – excluded from SELECT).
  const questionsResult = await supabase
    .from('questions')
    .select(
      'id, question_text, option_a, option_b, option_c, option_d, category, difficulty, time_seconds'
    )
    .in('id', questionIds)
    .eq('is_active', true)

  const questions = questionsResult.data as QuestionRow[] | null

  if (!questions) {
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }

  // Build a lookup map for O(1) access by id.
  const qMap = new Map(questions.map((q) => [q.id, q]))

  // Return questions in the session's randomised order, with answer options
  // also shuffled per the stored answer_order. correct_answer is never sent.
  const orderedQuestions = questionIds.map((qId, idx) => {
    const q = qMap.get(qId)
    if (!q) return null

    const shuffle = answerOrder[qId] ?? ['A', 'B', 'C', 'D']
    const optionText: Record<string, string> = {
      A: q.option_a,
      B: q.option_b,
      C: q.option_c,
      D: q.option_d,
    }
    // shuffle is an array like ["C","A","D","B"]: the original option that
    // appears in each display slot (A=slot0, B=slot1, C=slot2, D=slot3).
    const displayLabels = ['A', 'B', 'C', 'D'] as const
    const options = shuffle.map((origKey, slotIdx) => ({
      label: displayLabels[slotIdx],
      text: optionText[origKey] ?? '',
    }))

    return {
      id: q.id,
      index: idx,
      question_text: q.question_text,
      options,
      category: q.category,
      difficulty: q.difficulty,
      time_seconds: q.time_seconds,
    }
  })

  // Find how many questions have already been answered (resume support).
  const { count: answeredCount } = await supabase
    .from('user_answers')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId as string)

  return NextResponse.json({
    session_id: sessionId,
    questions: orderedQuestions.filter(Boolean),
    answered_count: answeredCount ?? 0,
  })
}
