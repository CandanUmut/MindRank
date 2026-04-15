import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ProfileRow = {
  id: string
  display_name: string
  avatar_url: string | null
  locale: string
  total_quizzes_taken: number
  show_on_leaderboard: boolean
  created_at: string
}

type SessionRow = {
  id: string
  score: number
  max_possible_score: number
  percentage: number | null
  time_spent_seconds: number | null
  status: string
  finished_at: string | null
  quiz_type_id: string | null
  quiz_types: {
    name_en: string
    slug: string
    icon: string
  } | null
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, locale, total_quizzes_taken, show_on_leaderboard, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Get quiz history
  const { data: sessions } = await supabase
    .from('quiz_sessions')
    .select(`
      id, score, max_possible_score, percentage, time_spent_seconds, status, finished_at, quiz_type_id,
      quiz_types (name_en, slug, icon)
    `)
    .eq('user_id', user.id)
    .in('status', ['completed', 'timed_out'])
    .order('finished_at', { ascending: false })

  const quizHistory = (sessions as SessionRow[] | null) ?? []

  // Compute category stats from all completed sessions
  const categoryStats: Record<string, { correct: number; total: number }> = {}
  let totalScore = 0
  let totalMaxScore = 0

  for (const s of quizHistory) {
    totalScore += s.score
    totalMaxScore += s.max_possible_score
  }

  const averageScore = totalMaxScore > 0
    ? Math.round((totalScore / totalMaxScore) * 100)
    : 0

  return NextResponse.json({
    profile: profile as ProfileRow,
    quiz_history: quizHistory.map((s) => ({
      id: s.id,
      quiz_name: s.quiz_types?.name_en ?? 'General Quiz',
      quiz_icon: s.quiz_types?.icon ?? '🧠',
      quiz_slug: s.quiz_types?.slug ?? 'general',
      score: s.score,
      max_score: s.max_possible_score,
      percentage: s.percentage ?? 0,
      time_spent_seconds: s.time_spent_seconds ?? 0,
      status: s.status,
      completed_at: s.finished_at,
    })),
    stats: {
      total_quizzes: (profile as ProfileRow).total_quizzes_taken,
      average_score: averageScore,
    },
    category_stats: categoryStats,
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { display_name?: string; show_on_leaderboard?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof body.display_name === 'string' && body.display_name.trim().length > 0) {
    updates.display_name = body.display_name.trim().slice(0, 50)
  }

  if (typeof body.show_on_leaderboard === 'boolean') {
    updates.show_on_leaderboard = body.show_on_leaderboard
  }

  const { error: updateError } = await supabase
    .from('profiles')
    // @ts-expect-error – postgrest-js resolves Update arg to never
    .update(updates)
    .eq('id', user.id)

  if (updateError) {
    console.error('[profile update]', updateError)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
