import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { data, error } = await supabase.rpc('get_my_ranking')

  if (error) {
    console.error('[get_my_ranking]', error)
    return NextResponse.json({ error: 'Failed to fetch ranking' }, { status: 500 })
  }

  const rows = data as RankingRow[] | null

  if (!rows || rows.length === 0) {
    return NextResponse.json({ ranking: null })
  }

  return NextResponse.json({ ranking: rows[0] })
}
