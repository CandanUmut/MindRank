import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  scoring_type: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let quizTypeId: string | undefined
  try {
    const body = await request.json()
    quizTypeId = body.quiz_type_id
  } catch {
    // No body is fine for legacy calls
  }

  // @ts-expect-error – postgrest-js RPC arg inference mismatch with optional params
  const { data: sessionId, error: rpcError } = await supabase.rpc('start_quiz_session', quizTypeId ? { p_quiz_type_id: quizTypeId } : {})

  if (rpcError) {
    const msg = rpcError.message ?? ''
    if (msg.includes('already_completed')) {
      return NextResponse.json({ error: 'already_completed' }, { status: 409 })
    }
    console.error('[start_quiz_session]', rpcError)
    return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 })
  }

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

  const questionsResult = await supabase
    .from('questions')
    .select(
      'id, question_text, option_a, option_b, option_c, option_d, category, difficulty, time_seconds, scoring_type'
    )
    .in('id', questionIds)
    .eq('is_active', true)

  const questions = questionsResult.data as QuestionRow[] | null

  if (!questions) {
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }

  const qMap = new Map(questions.map((q) => [q.id, q]))

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
      scoring_type: q.scoring_type,
    }
  })

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
