import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type LeaderboardRow = {
  rank: number
  display_name: string
  score: number
  percentage: number
  completed_at: string
  is_current_user: boolean
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const quizTypeId = searchParams.get('quiz_type_id')

  if (!quizTypeId) {
    return NextResponse.json({ error: 'quiz_type_id required' }, { status: 400 })
  }

  // @ts-expect-error – RPC args type narrowing issue
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_quiz_type_id: quizTypeId,
    p_limit: 10,
  })

  if (error) {
    console.error('[get_leaderboard]', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }

  return NextResponse.json({ leaderboard: data as LeaderboardRow[] })
}
