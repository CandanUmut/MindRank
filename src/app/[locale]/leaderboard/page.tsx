'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'

interface LeaderboardEntry {
  rank: number
  display_name: string
  score: number
  percentage: number
  completed_at: string
  is_current_user: boolean
}

interface QuizType {
  id: string
  slug: string
  name_en: string
  icon: string
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-500">Loading leaderboard...</p></div>}>
      <LeaderboardContent />
    </Suspense>
  )
}

function LeaderboardContent() {
  const searchParams = useSearchParams()
  const initialQuizTypeId = searchParams.get('quiz_type_id')

  const [quizTypes, setQuizTypes] = useState<QuizType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(initialQuizTypeId)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuizTypes() {
      const supabase = createClient()
      const { data } = await supabase
        .from('quiz_types')
        .select('id, slug, name_en, icon')
        .eq('is_active', true)
        .order('sort_order')

      if (data) {
        setQuizTypes(data as QuizType[])
        if (!selectedTypeId && data.length > 0) {
          setSelectedTypeId((data as QuizType[])[0].id)
        }
      }
      setLoading(false)
    }
    loadQuizTypes()
  }, [selectedTypeId])

  useEffect(() => {
    if (!selectedTypeId) return

    async function loadLeaderboard() {
      setLoading(true)
      const res = await fetch(`/api/quiz/leaderboard?quiz_type_id=${selectedTypeId}`)
      if (!res.ok) {
        setError('Failed to load leaderboard.')
        setLoading(false)
        return
      }
      const data = await res.json()
      setLeaderboard(data.leaderboard ?? [])
      setLoading(false)
    }
    loadLeaderboard()
  }, [selectedTypeId])

  const selectedType = quizTypes.find((qt) => qt.id === selectedTypeId)

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Top scores for each quiz type
            </p>
          </div>
          <a
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            Home
          </a>
        </div>

        {/* Quiz type selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {quizTypes.map((qt) => (
            <button
              key={qt.id}
              onClick={() => setSelectedTypeId(qt.id)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedTypeId === qt.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {qt.icon} {qt.name_en}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-6">{error}</p>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
            <p className="text-gray-600 mb-4">
              No scores yet for {selectedType?.name_en ?? 'this quiz'}. Be the first!
            </p>
            <a
              href="/"
              className="inline-block px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm"
            >
              Take a quiz
            </a>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-200">
                  <th className="px-4 py-3 font-medium text-gray-600 w-16">Rank</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Player</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Score</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right hidden sm:table-cell">%</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={`${entry.rank}-${entry.display_name}`}
                    className={`border-b border-gray-100 ${
                      entry.is_current_user
                        ? 'bg-blue-50 font-medium'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3 tabular-nums text-gray-500">
                      {entry.rank <= 3 ? (
                        <span className="text-lg">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        entry.rank
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {entry.display_name}
                      {entry.is_current_user && (
                        <span className="ml-2 text-xs text-blue-600">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {entry.score}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-500 hidden sm:table-cell">
                      {Number(entry.percentage).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <a
            href="/"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-sm"
          >
            Take a Quiz
          </a>
          <a
            href="/profile"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-sm"
          >
            My Profile
          </a>
        </div>
      </div>
    </main>
  )
}
