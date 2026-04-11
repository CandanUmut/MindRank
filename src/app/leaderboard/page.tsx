'use client'

import { useEffect, useState } from 'react'
import { getOrdinal, getPerformanceTier } from '@/lib/utils/scoring'

interface RankingData {
  my_score: number
  my_rank: number
  my_percentile: number
  total_participants: number
}

const tierBadge: Record<string, string> = {
  Exceptional: 'bg-green-100 text-green-800',
  Strong: 'bg-blue-100 text-blue-800',
  Solid: 'bg-yellow-100 text-yellow-800',
  Developing: 'bg-orange-100 text-orange-800',
  Emerging: 'bg-gray-100 text-gray-700',
}

export default function LeaderboardPage() {
  const [ranking, setRanking] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRanking() {
      const res = await fetch('/api/quiz/ranking')
      if (!res.ok) {
        setError('Failed to load ranking.')
        setLoading(false)
        return
      }
      const data = await res.json()
      setRanking(data.ranking ?? null)
      setLoading(false)
    }
    fetchRanking()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading ranking…</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-500 text-sm mb-10">
          All rankings are anonymous. You can only see your own position.
        </p>

        {error && (
          <p className="text-red-600 text-sm mb-6">{error}</p>
        )}

        {!ranking ? (
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
            <p className="text-gray-600 mb-4">
              Complete the quiz to see your ranking.
            </p>
            <a
              href="/"
              className="inline-block px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm"
            >
              Take the quiz
            </a>
          </div>
        ) : (
          <>
            {/* Rank card */}
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center mb-8">
              <p className="text-6xl font-bold text-blue-600 mb-2">
                {getOrdinal(Number(ranking.my_rank))}
              </p>
              <p className="text-gray-500 mb-6">
                out of{' '}
                <span className="font-semibold text-gray-700">
                  {Number(ranking.total_participants).toLocaleString()}
                </span>{' '}
                participants
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {ranking.my_score}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Score / 40</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {Math.max(1, Math.round(100 - Number(ranking.my_percentile)))}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Top</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {Number(ranking.my_percentile).toFixed(0)}th
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Percentile</p>
                </div>
              </div>

              {(() => {
                const tier = getPerformanceTier(Number(ranking.my_percentile))
                return (
                  <span
                    className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${tierBadge[tier]}`}
                  >
                    {tier}
                  </span>
                )
              })()}

              <p className="mt-6 text-gray-600 text-sm">
                You ranked{' '}
                <strong>{getOrdinal(Number(ranking.my_rank))}</strong> out of{' '}
                {Number(ranking.total_participants).toLocaleString()} participants
                {' '}(top{' '}
                {Math.max(1, Math.round(100 - Number(ranking.my_percentile)))}
                %)
              </p>
            </div>

            <div className="flex gap-3">
              <a
                href="/results"
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm"
              >
                ← Back to Results
              </a>
              <a
                href="/"
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-sm"
              >
                Home
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
