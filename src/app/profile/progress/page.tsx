'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/routing'
import { formatTime } from '@/lib/utils/scoring'

interface QuizHistoryEntry {
  id: string
  quiz_name: string
  quiz_icon: string
  quiz_slug: string
  score: number
  max_score: number
  percentage: number
  time_spent_seconds: number
  status: string
  completed_at: string | null
}

interface StatsData {
  total_quizzes: number
  average_score: number
}

interface CategoryStat {
  category: string
  correct: number
  total: number
  percentage: number
}

export default function ProgressPage() {
  const t = useTranslations('progress')
  const router = useRouter()
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/profile')
      if (res.status === 401) {
        router.replace('/auth/login?redirect=/profile/progress')
        return
      }
      if (!res.ok) {
        setLoading(false)
        return
      }
      const data = await res.json()
      setQuizHistory(data.quiz_history)
      setStats(data.stats)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">{t('title')}...</p>
      </div>
    )
  }

  // Compute weekly and monthly quiz counts
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const weekCount = quizHistory.filter(
    (q) => q.completed_at && new Date(q.completed_at) >= weekAgo
  ).length
  const monthCount = quizHistory.filter(
    (q) => q.completed_at && new Date(q.completed_at) >= monthAgo
  ).length

  // Group by quiz type slug to find best scores and retake candidates
  const byType: Record<string, QuizHistoryEntry[]> = {}
  for (const entry of quizHistory) {
    const key = entry.quiz_slug
    if (!byType[key]) byType[key] = []
    byType[key].push(entry)
  }

  const retakeCandidates = Object.entries(byType)
    .map(([slug, entries]) => {
      const best = entries.reduce((a, b) => (a.percentage > b.percentage ? a : b))
      return { slug, best, attempts: entries.length }
    })
    .filter((r) => r.best.percentage < 70)

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <Link href="/profile" className="text-sm text-blue-600 hover:underline">
            Profile
          </Link>
        </div>

        {/* Streak / Activity tracker */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 text-center">
            <p className="text-3xl font-bold text-blue-600">{weekCount}</p>
            <p className="text-xs text-blue-500 mt-1">{t('quizzesThisWeek')}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 text-center">
            <p className="text-3xl font-bold text-gray-800">{monthCount}</p>
            <p className="text-xs text-gray-500 mt-1">{t('quizzesThisMonth')}</p>
          </div>
        </div>

        {/* Retake encouragement */}
        {retakeCandidates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('retakeEncouragement')}</h2>
            <div className="space-y-3">
              {retakeCandidates.map((r) => (
                <div
                  key={r.slug}
                  className="flex items-center justify-between p-4 border border-amber-200 rounded-lg bg-amber-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{r.best.quiz_icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.best.quiz_name}</p>
                      <p className="text-xs text-gray-500">
                        {t('bestScore', { score: Number(r.best.percentage).toFixed(0) })} &middot; {t('attempts', { count: r.attempts })}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/"
                    className="px-3 py-1.5 text-sm font-medium text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100"
                  >
                    {t('retake')}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz timeline */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('quizTimeline')}</h2>
        {quizHistory.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">{t('noDataYet')}</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {quizHistory.map((entry) => (
              <Link
                key={entry.id}
                href={`/results?session_id=${entry.id}`}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">{entry.quiz_icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{entry.quiz_name}</p>
                    <p className="text-xs text-gray-400">
                      {entry.completed_at ? new Date(entry.completed_at).toLocaleDateString() : '—'}
                      {' · '}{formatTime(entry.time_spent_seconds)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-semibold text-gray-800">{entry.score}/{entry.max_score}</p>
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        entry.percentage >= 70 ? 'bg-green-500' : entry.percentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.min(100, entry.percentage)}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
